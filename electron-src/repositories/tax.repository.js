const { getDatabase } = require('../database/db');

class TaxRepository {
  get db() { return getDatabase(); }
  listRules({ countryCode, transactionType, includeDisabled = false } = {}) {
    let sql = 'SELECT id, country_code, transaction_type, name, short_name, rate, calculation_method, is_enabled, notes FROM tax_rules WHERE 1 = 1';
    const params = [];
    if (!includeDisabled) sql += ' AND is_enabled = 1';
    if (countryCode) { sql += ' AND country_code = ?'; params.push(countryCode); }
    if (transactionType) { sql += " AND (transaction_type = ? OR transaction_type = 'all')"; params.push(transactionType); }
    return this.db.prepare(`${sql} ORDER BY transaction_type, id`).all(...params);
  }

  updateRule(id, { rate, is_enabled }) {
    if (!id) throw new Error('معرّف الضريبة مطلوب');
    this.db.prepare('UPDATE tax_rules SET rate = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(rate || 0), Number(is_enabled) ? 1 : 0, id);
    return this.db.prepare('SELECT * FROM tax_rules WHERE id = ?').get(id);
  }
}

module.exports = new TaxRepository();