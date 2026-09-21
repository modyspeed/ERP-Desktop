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

  saveWarehouse({ id, branch_id = 1, _userId, currentUserId, ...data }) {
    const warehouse = { ...data, branch_id };
    return id ? this.update(id, warehouse) : this.create(warehouse);
  }

  transferStock({ branch_id = 1, from_warehouse_id, to_warehouse_id, items = [], _userId, currentUserId }) {
    if (!from_warehouse_id || !to_warehouse_id) throw new Error('Source and destination warehouses are required');
    if (Number(from_warehouse_id) === Number(to_warehouse_id)) throw new Error('Source and destination warehouses must be different');

    const normalizedItems = (items || []).map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity ?? item.qty),
    })).filter((item) => item.product_id > 0 && item.quantity > 0);

    if (!normalizedItems.length) throw new Error('At least one stock item is required');

    return this.db.transaction(() => {
      const db = this.db;
      const fromWarehouse = db.prepare('SELECT id FROM warehouses WHERE id = ? AND is_deleted = 0').get(from_warehouse_id);
      const toWarehouse = db.prepare('SELECT id FROM warehouses WHERE id = ? AND is_deleted = 0').get(to_warehouse_id);
      if (!fromWarehouse || !toWarehouse) throw new Error('Warehouse not found');

      const transferNumber = `TR-${Date.now()}`;
      const movements = [];
      const updateSource = db.prepare('UPDATE stock_levels SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND warehouse_id = ? AND quantity >= ?');
      const updateDestination = db.prepare(`
        INSERT INTO stock_levels (product_id, warehouse_id, quantity, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = CURRENT_TIMESTAMP
      `);
      const insertMovement = db.prepare(`
        INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
        VALUES (?, ?, ?, ?, ?, 'stock_transfer', NULL, ?, ?)
      `);

      for (const item of normalizedItems) {
        const source = db.prepare('SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?').get(item.product_id, from_warehouse_id);
        if (!source || source.quantity < item.quantity) {
          const product = db.prepare('SELECT name FROM products WHERE id = ?').get(item.product_id);
          throw new Error(`Insufficient stock: ${product?.name || `Product ${item.product_id}`}`);
        }

        updateSource.run(item.quantity, item.product_id, from_warehouse_id, item.quantity);
        updateDestination.run(item.product_id, to_warehouse_id, item.quantity);

        const out = insertMovement.run(branch_id, item.product_id, from_warehouse_id, 'transfer_out', -item.quantity, `${transferNumber} to warehouse ${to_warehouse_id}`, currentUserId || _userId || null);
        const inward = insertMovement.run(branch_id, item.product_id, to_warehouse_id, 'transfer_in', item.quantity, `${transferNumber} from warehouse ${from_warehouse_id}`, currentUserId || _userId || null);
        movements.push({ product_id: item.product_id, quantity: item.quantity, out_movement_id: out.lastInsertRowid, in_movement_id: inward.lastInsertRowid });
      }

      return { transfer_number: transferNumber, items_transferred: movements.length, movements };
    })();
  }
}

module.exports = new WarehouseRepository();
