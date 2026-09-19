const BaseRepository = require('./base.repository');

class ProductRepository extends BaseRepository {
  constructor() {
    super('products');
  }

  searchProducts({ query = '', branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `
      SELECT p.*, c.name AS category_name, u.symbol AS unit_symbol,
             COALESCE(SUM(sl.quantity), 0) AS stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE p.is_deleted = 0 AND p.branch_id = ?
    `;
    const params = [branch_id];

    if (query.trim()) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search, search);
    }

    sql += ' GROUP BY p.id';
    const countSql = `SELECT COUNT(*) AS total FROM (${sql})`;
    const total = this.db.prepare(countSql).get(...params).total;
    sql += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    return {
      items: this.db.prepare(sql).all(...params),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  listCategories(branchId = 1) {
    return this.db
      .prepare('SELECT id, name FROM categories WHERE branch_id = ? AND is_deleted = 0 ORDER BY name')
      .all(branchId);
  }

  saveProduct({ id, branch_id = 1, _userId, currentUserId, ...data }) {
    const product = {
      ...data,
      branch_id,
      category_id: data.category_id || null,
      unit_id: data.unit_id || null,
      cost_price: Number(data.cost_price || 0),
      sale_price: Number(data.sale_price || 0),
      min_stock_alert: Number(data.min_stock_alert || 0),
      is_active: data.is_active === undefined ? 1 : Number(data.is_active),
    };

    if (id) return this.update(id, product);
    return this.create(product);
  }
}

module.exports = new ProductRepository();