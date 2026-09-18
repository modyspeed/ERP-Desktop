const BaseRepository = require('./base.repository');

class WarehouseRepository extends BaseRepository {
  constructor() {
    super('warehouses');
  }

  searchWarehouses({ query = '', branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `SELECT * FROM warehouses WHERE is_deleted = 0 AND branch_id = ?`;
    const params = [branch_id];
    if (query.trim()) {
      sql += ' AND (name LIKE ? OR location LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search);
    }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getWarehouseStock(warehouseId) {
    return this.db.prepare(`
      SELECT sl.*, p.name AS product_name, p.sku, p.barcode
      FROM stock_levels sl
      LEFT JOIN products p ON p.id = sl.product_id
      WHERE sl.warehouse_id = ? AND p.is_deleted = 0
      ORDER BY p.name
    `).all(warehouseId);
  }
}

module.exports = new WarehouseRepository();
