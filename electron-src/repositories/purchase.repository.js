const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');
const { generateDocumentNumber } = require('../utils/numbering');
const { calculateTaxes } = require('../utils/tax');

class PurchaseRepository extends BaseRepository {
  constructor() { super('purchase_invoices'); }

  listInvoices({ branch_id = 1, query = '', page = 1, limit = 10 } = {}) {
    let sql = `SELECT pi.*, s.name AS supplier_name FROM purchase_invoices pi LEFT JOIN suppliers s ON s.id = pi.supplier_id WHERE pi.is_deleted = 0 AND pi.branch_id = ?`;
    const params = [branch_id];
    if (query.trim()) { sql += ' AND (pi.invoice_number LIKE ? OR s.name LIKE ?)'; const search = `%${query.trim()}%`; params.push(search, search); }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY pi.id DESC LIMIT ? OFFSET ?'; params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getFormOptions(branchId = 1) {
    return {
      suppliers: this.db.prepare('SELECT id, name FROM suppliers WHERE branch_id = ? AND is_deleted = 0 ORDER BY name').all(branchId),
      products: this.db.prepare('SELECT id, name, cost_price FROM products WHERE branch_id = ? AND is_deleted = 0 AND is_active = 1 ORDER BY name').all(branchId),
      warehouses: this.db.prepare('SELECT id, name FROM warehouses WHERE branch_id = ? AND is_deleted = 0 ORDER BY id').all(branchId),
    };
  }

  createInvoice({ branch_id = 1, supplier_id, warehouse_id, items, paid_amount = 0, tax_rule_ids = [], tax_overrides = [], created_by }) {
    const db = getDatabase();
    if (!supplier_id || !warehouse_id || !items?.length) throw new Error('المورد والمستودع والأصناف مطلوبة');
    const settings = db.prepare('SELECT invoice_prefix_purchase, tax_enabled, tax_percentage FROM company_settings LIMIT 1').get() || {};
    const taxRate = settings.tax_enabled ? Number(settings.purchase_tax_percentage ?? settings.tax_percentage ?? 0) : 0;
    const productQuery = db.prepare('SELECT id, name, cost_price FROM products WHERE id = ? AND branch_id = ? AND is_deleted = 0');
    const normalizedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const quantity = Number(item.qty);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('كميات الأصناف يجب أن تكون أكبر من صفر');
      const product = productQuery.get(item.product_id, branch_id);
      if (!product) throw new Error('أحد المنتجات غير موجود');
      const unitCost = Number(item.unit_cost ?? product.cost_price ?? 0);
      const lineTotal = quantity * unitCost;
      subtotal += lineTotal;
      normalizedItems.push({ product, quantity, unitCost, lineTotal });
    }
    const taxSummary = settings.tax_enabled ? calculateTaxes(db, { countryCode: settings.tax_country_code || 'SA', transactionType: 'purchase', subtotal, fallbackRate: taxRate, ruleIds: tax_rule_ids.map(Number).filter(Boolean), taxOverrides: tax_overrides }) : { details: [], totalTax: 0 };
    const taxAmount = taxSummary.totalTax;
    const total = subtotal + taxAmount;
    const paid = Math.max(0, Number(paid_amount || 0));
    if (paid > total) throw new Error('المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي');
    const remaining = total - paid;
    const paymentStatus = remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    const number = generateDocumentNumber('purchase_invoices', 'invoice_number', settings.invoice_prefix_purchase || 'PO-');

    return db.transaction(() => {
      const invoice = db.prepare('INSERT INTO purchase_invoices (branch_id, invoice_number, supplier_id, warehouse_id, date, subtotal, tax_amount, tax_details, total, paid_amount, remaining_amount, payment_status, created_by) VALUES (?, ?, ?, ?, date(\'now\'), ?, ?, ?, ?, ?, ?, ?, ?)').run(branch_id, number, supplier_id, warehouse_id, subtotal, taxAmount, JSON.stringify(taxSummary.details), total, paid, remaining, paymentStatus, created_by || null);
      const insertItem = db.prepare('INSERT INTO purchase_invoice_items (invoice_id, product_id, qty, unit_cost, line_total) VALUES (?, ?, ?, ?, ?)');
      const addStock = db.prepare('INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES (?, ?, ?) ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = CURRENT_TIMESTAMP');
      const insertMovement = db.prepare("INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'in', ?, 'purchase_invoice', ?, ?, ?)");
      for (const item of normalizedItems) {
        insertItem.run(invoice.lastInsertRowid, item.product.id, item.quantity, item.unitCost, item.lineTotal);
        addStock.run(item.product.id, warehouse_id, item.quantity);
        insertMovement.run(branch_id, item.product.id, warehouse_id, item.quantity, invoice.lastInsertRowid, `شراء ${number}`, created_by || null);
      }
      if (remaining > 0) db.prepare('UPDATE suppliers SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(remaining, supplier_id);
      return db.prepare('SELECT * FROM purchase_invoices WHERE id = ?').get(invoice.lastInsertRowid);
    })();
  }
}

module.exports = new PurchaseRepository();