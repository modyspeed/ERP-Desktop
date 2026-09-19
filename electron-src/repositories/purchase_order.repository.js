const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');
const { generateDocumentNumber } = require('../utils/numbering');
const { calculateTaxes } = require('../utils/tax');

class PurchaseOrderRepository extends BaseRepository {
  constructor() {
    super('purchase_orders');
  }

  searchPurchaseOrders({ query = '', branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `SELECT po.*, s.name AS supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON s.id = po.supplier_id WHERE po.is_deleted = 0 AND po.branch_id = ?`;
    const params = [branch_id];
    if (query.trim()) {
      sql += ' AND (po.po_number LIKE ? OR s.name LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search);
    }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY po.id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getFormOptions(branchId = 1) {
    return {
      suppliers: this.db.prepare('SELECT id, name FROM suppliers WHERE branch_id = ? AND is_deleted = 0 ORDER BY name').all(branchId),
      products: this.db.prepare(`SELECT p.id, p.name, p.barcode, p.cost_price, COALESCE(SUM(sl.quantity), 0) AS stock_quantity FROM products p LEFT JOIN stock_levels sl ON sl.product_id = p.id WHERE p.branch_id = ? AND p.is_deleted = 0 AND p.is_active = 1 GROUP BY p.id ORDER BY p.name`).all(branchId),
    };
  }

  getPurchaseOrder(id) {
    const po = this.db.prepare(`
      SELECT po.*, s.name AS supplier_name, s.phone AS supplier_phone, s.email AS supplier_email
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.id = ? AND po.is_deleted = 0
    `).get(id);
    if (po) {
      po.items = this.getPurchaseOrderItems(id);
    }
    return po;
  }

  getPurchaseOrderItems(poId) {
    return this.db.prepare(`
      SELECT poi.*, p.name AS product_name, p.sku, p.cost_price
      FROM purchase_order_items poi
      LEFT JOIN products p ON p.id = poi.product_id
      WHERE poi.po_id = ?
    `).all(poId);
  }

  savePurchaseOrder({ id, branch_id = 1, supplier_id, date, notes, items = [], total_amount = 0, status = 'pending', created_by }) {
    const db = getDatabase();
    if (!supplier_id) throw new Error('المورد مطلوب');
    if (!items || items.length === 0) throw new Error('يجب إضافة صنف واحد على الأقل');

    const settings = db.prepare('SELECT invoice_prefix_purchase FROM company_settings LIMIT 1').get() || {};
    const prefix = settings.invoice_prefix_purchase || 'PO-';

    return db.transaction(() => {
      let poId = id;
      const poNumber = generateDocumentNumber('purchase_orders', 'po_number', prefix);

      if (id) {
        db.prepare('UPDATE purchase_orders SET supplier_id = ?, date = ?, notes = ?, total_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 0')
          .run(supplier_id, date, notes || null, total_amount, status, id);
        db.prepare('DELETE FROM purchase_order_items WHERE po_id = ?').run(id);
      } else {
        const result = db.prepare('INSERT INTO purchase_orders (branch_id, supplier_id, po_number, date, notes, total_amount, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(branch_id, supplier_id, poNumber, date, notes || null, total_amount, status, created_by || null);
        poId = result.lastInsertRowid;
      }

      const insertItem = db.prepare('INSERT INTO purchase_order_items (po_id, product_id, qty, unit_cost) VALUES (?, ?, ?, ?)');
      for (const item of items) {
        insertItem.run(poId, item.product_id, item.qty, item.unit_cost || 0);
      }

      return this.getPurchaseOrder(poId);
    })();
  }

  convertToInvoice(poId, data = {}) {
    const db = getDatabase();
    const po = this.getPurchaseOrder(poId);
    if (!po) throw new Error('أمر الشراء غير موجود');
    if (po.status === 'invoiced') throw new Error('تم إنشاء فاتورة لهذا الأمر بالفعل');

    const items = this.getPurchaseOrderItems(poId);
    if (!items.length) throw new Error('أمر الشراء لا يحتوي على أصناف');

    return db.transaction(() => {
      const settings = db.prepare('SELECT invoice_prefix_purchase, tax_enabled, tax_country_code, tax_percentage, purchase_tax_percentage FROM company_settings LIMIT 1').get();
      const prefix = settings.invoice_prefix_purchase || 'PO-';
      const taxRate = settings.tax_enabled ? (Number(settings.purchase_tax_percentage ?? settings.tax_percentage ?? 0)) : 0;

      // Mark PO as invoiced
      db.prepare('UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('invoiced', poId);

      const invoiceNumber = generateDocumentNumber('purchase_invoices', 'invoice_number', prefix);
      const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unit_cost)), 0);
      const taxable = Math.max(0, subtotal);
      const taxSummary = settings.tax_enabled ? calculateTaxes(db, { countryCode: settings.tax_country_code || 'SA', transactionType: 'purchase', subtotal: taxable, fallbackRate: taxRate }) : { details: [], totalTax: 0 };
      const taxAmount = taxSummary.totalTax;
      const total = taxable + taxAmount;

      const invoice = db.prepare(`INSERT INTO purchase_invoices (branch_id, invoice_number, supplier_id, warehouse_id, date, subtotal, tax_amount, tax_details, total, paid_amount, remaining_amount, payment_status, created_by) VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?, 'paid', ?)`).run(
        po.branch_id, invoiceNumber, po.supplier_id, data.warehouse_id || 1, subtotal, taxAmount, JSON.stringify(taxSummary.details), total, total, total, poId
      );

      const insertItem = db.prepare('INSERT INTO purchase_invoice_items (invoice_id, product_id, qty, unit_cost, line_total) VALUES (?, ?, ?, ?, ?)');
      const updateStock = db.prepare('UPDATE stock_levels SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND warehouse_id = ?');
      const insertMovement = db.prepare(`INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'in', ?, 'purchase_invoice', ?, ?, ?)`);

      for (const item of items) {
        insertItem.run(invoice.lastInsertRowid, item.product_id, item.qty, item.unit_cost, item.qty * item.unit_cost);
        updateStock.run(item.qty, item.product_id, data.warehouse_id || 1);
        insertMovement.run(po.branch_id, item.product_id, data.warehouse_id || 1, item.qty, invoice.lastInsertRowid, `شراء من أمر - ${invoiceNumber}`, null);
      }

      return { invoice: db.prepare('SELECT * FROM purchase_invoices WHERE id = ?').get(invoice.lastInsertRowid), po_number: po.po_number };
    })();
  }
}

module.exports = new PurchaseOrderRepository();
