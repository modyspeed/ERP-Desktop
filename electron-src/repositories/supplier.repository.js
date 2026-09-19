const BaseRepository = require('./base.repository');

class SupplierRepository extends BaseRepository {
  constructor() { super('suppliers'); }

  searchSuppliers({ query = '', branch_id = 1, page = 1, limit = 10 } = {}) {
    let sql = 'SELECT * FROM suppliers WHERE is_deleted = 0 AND branch_id = ?';
    const params = [branch_id];
    if (query.trim()) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR tax_number LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search, search, search);
    }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  saveSupplier({ id, branch_id = 1, _userId, currentUserId, ...data }) {
    const supplier = { ...data, branch_id, opening_balance: Number(data.opening_balance || 0) };
    return id ? this.update(id, supplier) : this.create(supplier);
  }
}

module.exports = new SupplierRepository();