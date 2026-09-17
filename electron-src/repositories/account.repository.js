const BaseRepository = require('./base.repository');

class AccountRepository extends BaseRepository {
  constructor() { super('chart_of_accounts'); }

  listAccounts({ query = '' } = {}) {
    let sql = `SELECT a.*, p.name AS parent_name FROM chart_of_accounts a LEFT JOIN chart_of_accounts p ON p.id = a.parent_id WHERE a.is_deleted = 0`;
    const params = [];
    if (query.trim()) { sql += ' AND (a.name LIKE ? OR a.code LIKE ?)'; const search = `%${query.trim()}%`; params.push(search, search); }
    sql += ' ORDER BY a.code ASC';
    return this.db.prepare(sql).all(...params);
  }

  saveAccount({ id, ...data }) {
    const account = { ...data, parent_id: data.parent_id || null, is_active: data.is_active === undefined ? 1 : Number(data.is_active) };
    if (!account.code || !account.name || !account.account_type) throw new Error('رمز الحساب واسمه ونوعه مطلوبة');
    return id ? this.update(id, account) : this.create(account);
  }

  listCatalogs() {
    return this.db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM accounting_catalog_accounts ca WHERE ca.catalog_id = c.id) AS accounts_count, p.active_catalog_id = c.id AS is_active FROM accounting_catalogs c LEFT JOIN accounting_preferences p ON p.id = 1 ORDER BY c.is_system DESC, c.name`).all();
  }

  createCatalog({ name, country_code = 'CUSTOM', description = '' }) {
    if (!name || !name.trim()) throw new Error('اسم الدليل مطلوب');
    return this.db.prepare('INSERT INTO accounting_catalogs (name, country_code, description, is_system) VALUES (?, ?, ?, 0)').run(name.trim(), country_code, description || null);
  }

  applyCatalog(catalogId) {
    const db = this.db;
    const catalog = db.prepare('SELECT * FROM accounting_catalogs WHERE id = ?').get(catalogId);
    if (!catalog) throw new Error('الدليل المحاسبي غير موجود');
    return db.transaction(() => {
      const templateAccounts = db.prepare('SELECT * FROM accounting_catalog_accounts WHERE catalog_id = ? ORDER BY sort_order, id').all(catalogId);
      const insertAccount = db.prepare('INSERT OR IGNORE INTO chart_of_accounts (code, name, account_type, parent_id) VALUES (?, ?, ?, ?)');
      for (const account of templateAccounts) {
        const parent = account.parent_code ? db.prepare('SELECT id FROM chart_of_accounts WHERE code = ? AND is_deleted = 0').get(account.parent_code) : null;
        insertAccount.run(account.code, account.name, account.account_type, parent?.id || null);
      }
      db.prepare('UPDATE accounting_preferences SET active_catalog_id = ? WHERE id = 1').run(catalogId);
      return catalog;
    })();
  }
}

module.exports = new AccountRepository();