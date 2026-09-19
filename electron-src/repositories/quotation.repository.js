const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');
const { generateDocumentNumber } = require('../utils/numbering');
const { calculateTaxes } = require('../utils/tax');

class QuotationRepository extends BaseRepository {
  constructor() {
    super('quotations');
  }

  searchQuotations({ query = '', branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `SELECT q.*, c.name AS customer_name FROM quotations q LEFT JOIN customers c ON c.id = q.customer_id WHERE q.is_deleted = 0 AND q.branch_id = ?`;
    const params = [branch_id];
    if (query.trim()) {
      sql += ' AND (q.quote_number LIKE ? OR c.name LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search);
    }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY q.id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getFormOptions(branchId = 1) {
    return {
      customers: this.db.prepare('SELECT id, name FROM customers WHERE branch_id = ? AND is_deleted = 0 ORDER BY name').all(branchId),
      products: this.db.prepare(`SELECT p.id, p.name, p.barcode, p.sale_price, COALESCE(SUM(sl.quantity), 0) AS stock_quantity FROM products p LEFT JOIN stock_levels sl ON sl.product_id = p.id WHERE p.branch_id = ? AND p.is_deleted = 0 AND p.is_active = 1 GROUP BY p.id ORDER BY p.name`).all(branchId),
    };
  }

  saveQuotation({ id, branch_id = 1, customer_id, date, expiry_date, notes, items = [], total_amount = 0, status = 'draft', created_by }) {
    const db = getDatabase();
    if (!customer_id) throw new Error('العميل مطلوب');
    if (!items || items.length === 0) throw new Error('يجب إضافة صنف واحد على الأقل');

    const settings = db.prepare('SELECT invoice_prefix_sales FROM company_settings LIMIT 1').get() || {};
    const prefix = settings.invoice_prefix_sales || 'QUO-';

    return db.transaction(() => {
      let qId = id;
      const qNumber = generateDocumentNumber('quotations', 'quote_number', prefix);

      if (id) {
        db.prepare('UPDATE quotations SET customer_id = ?, date = ?, expiry_date = ?, notes = ?, total_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 0')
          .run(customer_id, date, expiry_date || null, notes || null, total_amount, status, id);
        db.prepare('DELETE FROM quotation_items WHERE quotation_id = ?').run(id);
      } else {
        const result = db.prepare('INSERT INTO quotations (branch_id, customer_id, quote_number, date, expiry_date, notes, total_amount, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(branch_id, customer_id, qNumber, date, expiry_date || null, notes || null, total_amount, status, created_by || null);
        qId = result.lastInsertRowid;
      }

      const insertItem = db.prepare('INSERT INTO quotation_items (quotation_id, product_id, qty, unit_price, discount, tax) VALUES (?, ?, ?, ?, ?, ?)');
      for (const item of items) {
        insertItem.run(qId, item.product_id, item.qty, item.unit_price || 0, item.discount || 0, item.tax || 0);
      }

      return this.getQuotation(qId);
    })();
  }

  getQuotationItems(quotationId) {
    return this.db.prepare(`
      SELECT qi.*, p.name AS product_name, p.sku
      FROM quotation_items qi
      LEFT JOIN products p ON p.id = qi.product_id
      WHERE qi.quotation_id = ?
    `).all(quotationId);
  }

  getQuotation(id) {
    const q = this.db.prepare(`
      SELECT q.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address AS customer_address
      FROM quotations q
      LEFT JOIN customers c ON c.id = q.customer_id
      WHERE q.id = ? AND q.is_deleted = 0
    `).get(id);
    if (q) {
      q.items = this.getQuotationItems(id);
    }
    return q;
  }

  convertToInvoice(quotationId, data = {}) {
    const db = getDatabase();
    const quotation = this.getQuotation(quotationId);
    if (!quotation) throw new Error('العرض غير موجود');
    if (quotation.status === 'converted') throw new Error('تم تحويل هذا العرض بالفعل');
    if (!data.customer_id) throw new Error('العميل مطلوب');

    const items = this.getQuotationItems(quotationId);
    if (!items.length) throw new Error('العرض لا يحتوي على أصناف');

    const settings = db.prepare('SELECT invoice_prefix_sales, tax_enabled, tax_country_code, tax_percentage FROM company_settings LIMIT 1').get();
    const prefix = settings.invoice_prefix_sales || 'INV-';
    const taxRate = settings.tax_enabled ? (Number(settings.tax_percentage ?? settings.tax_percentage ?? 0)) : 0;

    return db.transaction(() => {
      // Mark quotation as converted
      db.prepare('UPDATE quotations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('converted', quotationId);

      // Generate invoice number and create invoice using same logic as sales
      const invoiceNumber = generateDocumentNumber('sales_invoices', 'invoice_number', prefix);
      const branchId = quotation.branch_id;
      const warehouseId = data.warehouse_id || 1;

      // Calculate totals from quotation items
      let subtotal = 0;
      const normalizedItems = [];
      for (const item of items) {
        const quantity = Number(item.qty);
        const unitPrice = Number(item.unit_price ?? 0);
        const lineTotal = quantity * unitPrice;
        subtotal += lineTotal;
        normalizedItems.push({ product: { id: item.product_id, name: item.product_name, sale_price: unitPrice }, quantity, unitPrice, lineTotal });
      }

      const safeDiscount = 0;
      const taxable = Math.max(0, subtotal - safeDiscount);
      const taxSummary = settings.tax_enabled ? calculateTaxes(db, { countryCode: settings.tax_country_code || 'SA', transactionType: 'sale', subtotal: taxable, fallbackRate: taxRate }) : { details: [], totalTax: 0 };
      const taxAmount = taxSummary.totalTax;
      const total = taxable + taxAmount;

      const invoice = db.prepare(`INSERT INTO sales_invoices (branch_id, invoice_number, customer_id, warehouse_id, date, subtotal, discount, tax_amount, tax_details, total, paid_amount, remaining_amount, payment_status, invoice_type, source, created_by) VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?, 'cash', 'manual', ?)`).run(
        branchId, invoiceNumber, data.customer_id, warehouseId, subtotal, safeDiscount, taxAmount, JSON.stringify(taxSummary.details), total, total, total, 'manual', quotationId
      );

      const insertItem = db.prepare('INSERT INTO sales_invoice_items (invoice_id, product_id, qty, unit_price, discount, tax, line_total) VALUES (?, ?, ?, ?, 0, 0, ?)');
      const updateStock = db.prepare('UPDATE stock_levels SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND warehouse_id = ? AND quantity >= ?');
      const insertMovement = db.prepare(`INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'out', ?, 'sales_invoice', ?, ?, ?)`);

      for (const item of normalizedItems) {
        insertItem.run(invoice.lastInsertRowid, item.product.id, item.quantity, item.unitPrice, item.lineTotal);
        const changed = updateStock.run(item.quantity, item.product.id, warehouseId, item.quantity);
        if (!changed.changes) throw new Error(`المخزون غير كافٍ للمنتج: ${item.product.name}`);
        insertMovement.run(branchId, item.product.id, warehouseId, item.quantity, invoice.lastInsertRowid, `عرض لسعر - ${invoiceNumber}`, null);
      }

      return { invoice: db.prepare('SELECT * FROM sales_invoices WHERE id = ?').get(invoice.lastInsertRowid), quotation_id: quotationId };
    })();
  }
}

module.exports = new QuotationRepository();
