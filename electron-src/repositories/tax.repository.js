const { getDatabase } = require('../database/db');

const TAX_TYPE_CATALOG = [
  'vat', 'gst', 'sales_tax', 'withholding_tax', 'excise_tax',
  'customs_duty', 'stamp_duty', 'municipal_tax', 'service_tax',
  'tourism_tax', 'zero_rated', 'tax_exempt', 'digital_services_tax', 'other'
];

class TaxRepository {
  get db() { return getDatabase(); }
  listRules({ countryCode, transactionType, includeDisabled = false } = {}) {
    let sql = 'SELECT id, country_code, transaction_type, name, short_name, rate, tax_type, effective_from, effective_to, is_default, calculation_method, is_enabled, notes FROM tax_rules WHERE 1 = 1';
    const params = [];
    if (!includeDisabled) sql += ' AND is_enabled = 1';
    if (countryCode) { sql += ' AND country_code = ?'; params.push(countryCode); }
    if (transactionType) { sql += " AND (transaction_type = ? OR transaction_type = 'all')"; params.push(transactionType); }
    return this.db.prepare(`${sql} ORDER BY transaction_type, id`).all(...params);
  }

  createRule({ country_code, transaction_type, name, short_name, rate, tax_type, effective_from, effective_to, is_default, calculation_method, is_enabled, notes }) {
    if (!country_code) throw new Error('كود البلد مطلوب');
    if (!transaction_type) throw new Error('نوع المعاملة مطلوب');
    if (!name) throw new Error('اسم الضريبة مطلوب');
    const resolvedTaxType = tax_type || 'other';
    const stmt = this.db.prepare(
      'INSERT INTO tax_rules (country_code, transaction_type, name, short_name, rate, tax_type, effective_from, effective_to, is_default, calculation_method, is_enabled, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    );
    const result = stmt.run(
      country_code,
      transaction_type,
      name,
      short_name || null,
      Number(rate || 0),
      resolvedTaxType,
      effective_from || null,
      effective_to || null,
      is_default ? 1 : 0,
      calculation_method || 'additive',
      is_enabled !== false ? 1 : 0,
      notes || null
    );
    return this.db.prepare('SELECT * FROM tax_rules WHERE id = ?').get(result.lastInsertRowid);
  }

  deleteRule(id) {
    if (!id) throw new Error('معرّف الضريبة مطلوب');
    const rule = this.db.prepare('SELECT name, short_name FROM tax_rules WHERE id = ?').get(Number(id));
    if (!rule) throw new Error('الضريبة غير موجودة');

    const salesCount = this.db.prepare("SELECT COUNT(*) AS total FROM sales_invoices WHERE tax_details LIKE ? ESCAPE '\\'").get(`%${rule.name.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`).total;
    const purchaseCount = this.db.prepare("SELECT COUNT(*) AS total FROM purchase_invoices WHERE tax_details LIKE ? ESCAPE '\\'").get(`%${rule.name.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`).total;
    if (salesCount > 0 || purchaseCount > 0) {
      throw new Error(`لا يمكن حذف هذه الضريبة لأنها مستخدمة في ${salesCount + purchaseCount} فاتورة. قم بإلغاء تفعيلها بدلاً من حذفها.`);
    }

    const result = this.db.prepare('DELETE FROM tax_rules WHERE id = ?').run(Number(id));
    return { success: result.changes > 0 };
  }

  updateRule(id, { rate, is_enabled }) {
    if (!id) throw new Error('معرّف الضريبة مطلوب');
    this.db.prepare('UPDATE tax_rules SET rate = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(rate || 0), Number(is_enabled) ? 1 : 0, id);
    return this.db.prepare('SELECT * FROM tax_rules WHERE id = ?').get(id);
  }
}

module.exports = new TaxRepository();
module.exports.TAX_TYPE_CATALOG = TAX_TYPE_CATALOG;