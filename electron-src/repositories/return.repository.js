const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');
const { generateDocumentNumber } = require('../utils/numbering');

class ReturnRepository extends BaseRepository {
  constructor() {
    super('sales_returns');
  }

  searchSalesReturns({ query = '', branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `SELECT r.*, si.invoice_number, c.name AS customer_name FROM sales_returns r LEFT JOIN sales_invoices si ON si.id = r.invoice_id LEFT JOIN customers c ON c.id = si.customer_id WHERE r.is_deleted = 0 AND r.branch_id = ?`;
    const params = [branch_id];
    if (query.trim()) {
      sql += ' AND (r.return_number LIKE ? OR si.invoice_number LIKE ? OR c.name LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search, search);
    }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getSalesReturnItems(returnId) {
    return this.db.prepare(`SELECT rri.*, p.name AS product_name, p.sku FROM sales_return_items rri LEFT JOIN products p ON p.id = rri.product_id WHERE rri.return_id = ?`).all(returnId);
  }

  getSalesReturn(id) {
    return this.db.prepare(`SELECT r.*, c.name AS customer_name, si.invoice_number FROM sales_returns r LEFT JOIN customers c ON c.id = r.customer_id LEFT JOIN sales_invoices si ON si.id = r.invoice_id WHERE r.id = ? AND r.is_deleted = 0`).get(id);
  }

  createSalesReturn({ branch_id = 1, invoice_id, date, items, reason, created_by }) {
    const db = getDatabase();
    const returnNumber = generateDocumentNumber('sales_returns', 'return_number', 'RET-');
    // Get customer_id and warehouse_id from invoice
    const invoice = db.prepare('SELECT customer_id, warehouse_id FROM sales_invoices WHERE id = ?').get(invoice_id);
    if (!invoice) throw new Error('الفاتورة غير موجودة');

    return db.transaction(() => {
      const result = db.prepare("INSERT INTO sales_returns (branch_id, invoice_id, return_number, date, total_amount, reason, created_by) VALUES (?, ?, ?, date('now'), 0, ?, ?)").run(branch_id, invoice_id, returnNumber, reason, created_by);

      const insertItem = db.prepare('INSERT INTO sales_return_items (return_id, product_id, qty, unit_price) VALUES (?, ?, ?, ?)');
      const updateStock = db.prepare(`INSERT INTO stock_levels (product_id, warehouse_id, quantity, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = CURRENT_TIMESTAMP`);
      const insertMovement = db.prepare(`INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'in', ?, 'sales_return', ?, ?, ?)`);

      let totalAmount = 0;
      for (const item of items) {
        const product = db.prepare('SELECT sale_price FROM products WHERE id = ? AND branch_id = ?').get(item.product_id, branch_id);
        const unitPrice = Number(item.unit_price ?? product?.sale_price ?? 0);
        const lineTotal = Number(item.qty) * unitPrice;
        totalAmount += lineTotal;
        insertItem.run(result.lastInsertRowid, item.product_id, item.qty, unitPrice);
        updateStock.run(item.product_id, invoice?.warehouse_id, item.qty);
        insertMovement.run(branch_id, item.product_id, invoice?.warehouse_id, item.qty, result.lastInsertRowid, `مرتجع بيع - ${returnNumber}`, created_by || null);
      }

      db.prepare('UPDATE sales_returns SET total_amount = ? WHERE id = ?').run(totalAmount, result.lastInsertRowid);

      // Reverse the customer balance for the returned amount and post a balanced
      // credit note journal entry, mirroring the sales invoice flow in reverse.
      if (invoice.customer_id && totalAmount > 0) {
        db.prepare('UPDATE customers SET current_balance = current_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(totalAmount, invoice.customer_id);
      }

      const { resolveAccount, createJournalEntry } = require('../utils/journal');
      const { calculateTaxes } = require('../utils/tax');
      const settings = db.prepare('SELECT tax_enabled, tax_country_code, tax_percentage, sales_tax_percentage FROM company_settings LIMIT 1').get() || {};
      const taxRate = settings.tax_enabled ? Number(settings.sales_tax_percentage ?? settings.tax_percentage ?? 0) : 0;
      const taxSummary = settings.tax_enabled ? calculateTaxes(db, { countryCode: settings.tax_country_code || 'SA', transactionType: 'sale', subtotal: totalAmount, fallbackRate: taxRate }) : { details: [], totalTax: 0 };
      const taxAmount = taxSummary.totalTax;

      const journalLines = [];
      const revenueAccount = resolveAccount(db, '4110', 'revenue', 'مبيعات');
      const taxAccount = resolveAccount(db, '2210', 'liability', 'قيمة المضافة');
      const receivableAccount = resolveAccount(db, '1210', 'asset', 'عملاء');

      if (receivableAccount) journalLines.push({ account_id: receivableAccount, debit: 0, credit: totalAmount + taxAmount });
      if (revenueAccount) journalLines.push({ account_id: revenueAccount, debit: totalAmount, credit: 0 });
      for (const detail of taxSummary.details) {
        if (!taxAccount) break;
        const amount = Number(detail.amount || 0);
        if (amount > 0) journalLines.push({ account_id: taxAccount, debit: amount, credit: 0 });
      }

      createJournalEntry(db, {
        branch_id,
        description: `مرتجع بيع ${returnNumber}`,
        reference_type: 'sales_return',
        reference_id: result.lastInsertRowid,
        lines: journalLines,
        created_by,
      });

      return { return_data: db.prepare('SELECT * FROM sales_returns WHERE id = ?').get(result.lastInsertRowid), items: this.getSalesReturnItems(result.lastInsertRowid) };
    })();
  }

  searchPurchaseReturns({ query = '', branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `SELECT r.*, pi.invoice_number, s.name AS supplier_name FROM purchase_returns r LEFT JOIN purchase_invoices pi ON pi.id = r.invoice_id LEFT JOIN suppliers s ON s.id = pi.supplier_id WHERE r.is_deleted = 0 AND r.branch_id = ?`;
    const params = [branch_id];
    if (query.trim()) {
      sql += ' AND (r.return_number LIKE ? OR pi.invoice_number LIKE ? OR s.name LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search, search);
    }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getPurchaseReturnItems(returnId) {
    return this.db.prepare(`SELECT pri.*, p.name AS product_name, p.sku FROM purchase_return_items pri LEFT JOIN products p ON p.id = pri.product_id WHERE pri.return_id = ?`).all(returnId);
  }

  getPurchaseReturn(id) {
    return this.db.prepare(`SELECT r.*, s.name AS supplier_name, pi.invoice_number FROM purchase_returns r LEFT JOIN purchase_invoices pi ON pi.id = r.invoice_id LEFT JOIN suppliers s ON s.id = pi.supplier_id WHERE r.id = ? AND r.is_deleted = 0`).get(id);
  }

  createPurchaseReturn({ branch_id = 1, invoice_id, date, items, created_by }) {
    const db = getDatabase();
    const returnNumber = generateDocumentNumber('purchase_returns', 'return_number', 'PRV-');
    const invoice = db.prepare('SELECT supplier_id, warehouse_id FROM purchase_invoices WHERE id = ?').get(invoice_id);

    return db.transaction(() => {
      const result = db.prepare("INSERT INTO purchase_returns (branch_id, invoice_id, return_number, date, total_amount, created_by) VALUES (?, ?, ?, date('now'), 0, ?)").run(branch_id, invoice_id, returnNumber, created_by);

      const insertItem = db.prepare('INSERT INTO purchase_return_items (return_id, product_id, qty, unit_cost) VALUES (?, ?, ?, ?)');
      const updateStock = db.prepare('UPDATE stock_levels SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND warehouse_id = ?');
      const insertMovement = db.prepare(`INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'in', ?, 'purchase_return', ?, ?, ?)`);

      let totalAmount = 0;
      for (const item of items) {
        const product = db.prepare('SELECT cost_price FROM products WHERE id = ? AND branch_id = ?').get(item.product_id, branch_id);
        const unitCost = Number(item.unit_cost ?? product?.cost_price ?? 0);
        const lineTotal = Number(item.qty) * unitCost;
        totalAmount += lineTotal;
        insertItem.run(result.lastInsertRowid, item.product_id, item.qty, unitCost);
        updateStock.run(item.qty, item.product_id, invoice?.warehouse_id);
        insertMovement.run(branch_id, item.product_id, invoice?.warehouse_id, item.qty, result.lastInsertRowid, `مرتجع شراء - ${returnNumber}`, created_by || null);
      }

      db.prepare('UPDATE purchase_returns SET total_amount = ? WHERE id = ?').run(totalAmount, result.lastInsertRowid);
      return { return_data: db.prepare('SELECT * FROM purchase_returns WHERE id = ?').get(result.lastInsertRowid), items: this.getPurchaseReturnItems(result.lastInsertRowid) };
    })();
  }
}

module.exports = new ReturnRepository();
