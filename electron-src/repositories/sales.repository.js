const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');
const { generateDocumentNumber } = require('../utils/numbering');
const { calculateTaxes } = require('../utils/tax');
const { resolveAccount, createJournalEntry } = require('../utils/journal');
const auditRepository = require('./audit.repository');

class SalesRepository extends BaseRepository {
  constructor() {
    super('sales_invoices');
  }

  listInvoices({ branch_id = 1, query = '', page = 1, limit = 10 } = {}) {
    let sql = `
      SELECT si.*, c.name AS customer_name
      FROM sales_invoices si
      LEFT JOIN customers c ON c.id = si.customer_id
      WHERE si.is_deleted = 0 AND si.branch_id = ?
    `;
    const params = [branch_id];
    if (query.trim()) {
      sql += ' AND (si.invoice_number LIKE ? OR c.name LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search);
    }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY si.id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getFormOptions(branchId = 1) {
    return {
      customers: this.db.prepare('SELECT id, name FROM customers WHERE branch_id = ? AND is_deleted = 0 ORDER BY name').all(branchId),
      products: this.db.prepare(`SELECT p.id, p.name, p.barcode, p.sale_price, COALESCE(SUM(sl.quantity), 0) AS stock_quantity FROM products p LEFT JOIN stock_levels sl ON sl.product_id = p.id WHERE p.branch_id = ? AND p.is_deleted = 0 AND p.is_active = 1 GROUP BY p.id ORDER BY p.name`).all(branchId),
      warehouses: this.db.prepare('SELECT id, name FROM warehouses WHERE branch_id = ? AND is_deleted = 0 ORDER BY id').all(branchId),
    };
  }

  createInvoice({ branch_id = 1, customer_id, warehouse_id, items, discount = 0, paid_amount = 0, invoice_type = 'cash', source = 'manual', table_id, tax_rule_ids = [], tax_overrides = [], created_by }) {
    const db = getDatabase();
    if (!warehouse_id || !items?.length) throw new Error('المستودع والأصناف مطلوبان');

    const settings = db.prepare('SELECT invoice_prefix_sales, tax_enabled, tax_percentage, sales_tax_percentage, tax_country_code FROM company_settings LIMIT 1').get() || {};
    const prefix = settings.invoice_prefix_sales || 'INV-';
    const taxRate = settings.tax_enabled ? Number(settings.sales_tax_percentage ?? settings.tax_percentage ?? 0) : 0;
    const productQuery = db.prepare('SELECT id, name, cost_price, sale_price FROM products WHERE id = ? AND branch_id = ? AND is_deleted = 0');
    const stockQuery = db.prepare('SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?');
    const normalizedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = Number(item.qty);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('كميات الأصناف يجب أن تكون أكبر من صفر');
      const product = productQuery.get(item.product_id, branch_id);
      if (!product) throw new Error('أحد المنتجات غير موجود');
      const stock = stockQuery.get(product.id, warehouse_id);
      if (Number(stock?.quantity || 0) < quantity) throw new Error(`المخزون غير كافٍ للمنتج: ${product.name}`);
      const unitPrice = Number(item.unit_price ?? product.sale_price ?? 0);
      const lineTotal = quantity * unitPrice;
      subtotal += lineTotal;
      normalizedItems.push({ product, quantity, unitPrice, lineTotal });
    }

    const safeDiscount = Math.max(0, Number(discount || 0));
    const taxable = Math.max(0, subtotal - safeDiscount);
    const taxSummary = settings.tax_enabled ? calculateTaxes(db, { countryCode: settings.tax_country_code || 'SA', transactionType: 'sale', subtotal: taxable, fallbackRate: taxRate, ruleIds: tax_rule_ids.map(Number).filter(Boolean), taxOverrides: tax_overrides }) : { details: [], totalTax: 0 };
    const taxAmount = taxSummary.totalTax;
    const total = taxable + taxAmount;
    const paid = Math.max(0, Number(paid_amount || 0));
    if (paid > total) throw new Error('المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة');
    const remaining = total - paid;
    const paymentStatus = remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    const invoiceNumber = generateDocumentNumber('sales_invoices', 'invoice_number', prefix);
    const tableId = table_id ? Number(table_id) : null;
    const existingTable = tableId ? db.prepare('SELECT * FROM tables WHERE id = ? AND is_deleted = 0').get(tableId) : null;
    if (tableId && !existingTable) throw new Error('الطاولة المرتبطة بالفاتورة غير موجودة');

    return db.transaction(() => {
      const invoice = db.prepare(`INSERT INTO sales_invoices (branch_id, invoice_number, customer_id, warehouse_id, date, subtotal, discount, tax_amount, tax_details, total, paid_amount, remaining_amount, payment_status, invoice_type, source, table_id, created_by) VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(branch_id, invoiceNumber, customer_id || null, warehouse_id, subtotal, safeDiscount, taxAmount, JSON.stringify(taxSummary.details), total, paid, remaining, paymentStatus, invoice_type, source, tableId, created_by || null);
      const insertItem = db.prepare('INSERT INTO sales_invoice_items (invoice_id, product_id, qty, unit_price, discount, tax, line_total) VALUES (?, ?, ?, ?, 0, 0, ?)');
      const updateStock = db.prepare('UPDATE stock_levels SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND warehouse_id = ? AND quantity >= ?');
      const insertMovement = db.prepare(`INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'out', ?, 'sales_invoice', ?, ?, ?)`);
      for (const item of normalizedItems) {
        insertItem.run(invoice.lastInsertRowid, item.product.id, item.quantity, item.unitPrice, item.lineTotal);
        const changed = updateStock.run(item.quantity, item.product.id, warehouse_id, item.quantity);
        if (!changed.changes) throw new Error(`تعذر تحديث مخزون المنتج: ${item.product.name}`);
        insertMovement.run(branch_id, item.product.id, warehouse_id, item.quantity, invoice.lastInsertRowid, `بيع ${invoiceNumber}`, created_by || null);
      }
      if (customer_id && remaining > 0) db.prepare('UPDATE customers SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(remaining, customer_id);

      // Auto-post a balanced journal entry for the invoice. The tax is kept as
      // its own credit line (VAT on sales) instead of being merged into revenue.
      const journalLines = [];
      const revenueAccount = resolveAccount(db, '4110', 'revenue', 'مبيعات');
      const taxAccount = resolveAccount(db, '2210', 'liability', 'قيمة المضافة');
      const cashAccount = resolveAccount(db, '1110', 'asset', 'صندوق');
      const receivableAccount = resolveAccount(db, '1210', 'asset', 'عملاء');

      if (paid > 0 && cashAccount) journalLines.push({ account_id: cashAccount, debit: paid, credit: 0 });
      if (remaining > 0 && receivableAccount) journalLines.push({ account_id: receivableAccount, debit: remaining, credit: 0 });
      if (revenueAccount) journalLines.push({ account_id: revenueAccount, debit: 0, credit: taxable });
      for (const detail of taxSummary.details) {
        if (!taxAccount) break;
        const amount = Number(detail.amount || 0);
        if (amount > 0) journalLines.push({ account_id: taxAccount, debit: 0, credit: amount });
        else if (amount < 0) journalLines.push({ account_id: taxAccount, debit: -amount, credit: 0 });
      }

      createJournalEntry(db, {
        branch_id,
        description: `فاتورة بيع ${invoiceNumber}`,
        reference_type: 'sales_invoice',
        reference_id: invoice.lastInsertRowid,
        lines: journalLines,
        created_by,
      });

      // عند دفع فاتورة مرتبطة بطاولة، تعود الطاولة لحالة "متاحة" تلقائياً
      if (tableId && paymentStatus === 'paid') {
        const freedTable = { ...existingTable, status: 'available' };
        db.prepare("UPDATE tables SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 0").run(tableId);
        auditRepository.log({
          userId: created_by || null,
          module: 'tables',
          action: 'update_status',
          recordId: tableId,
          oldValue: existingTable,
          newValue: freedTable,
        });
      }

      return db.prepare('SELECT * FROM sales_invoices WHERE id = ?').get(invoice.lastInsertRowid);
    })();
  }
}

module.exports = new SalesRepository();