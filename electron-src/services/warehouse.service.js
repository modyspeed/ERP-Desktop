const warehouseRepository = require('../repositories/warehouse.repository');
const { getDatabase } = require('../database/db');
const { generateDocumentNumber } = require('../utils/numbering');

class WarehouseService {
  searchWarehouses(params) { return warehouseRepository.searchWarehouses(params || {}); }
  getWarehouseStock(warehouseId) { return warehouseRepository.getWarehouseStock(warehouseId); }

  saveWarehouse({ id, branch_id = 1, ...data }) {
    const warehouse = { ...data, branch_id };
    return id ? warehouseRepository.update(id, warehouse) : warehouseRepository.create(warehouse);
  }

  transferStock({ from_warehouse_id, to_warehouse_id, items, branch_id = 1, notes, created_by }) {
    const db = getDatabase();
    if (!from_warehouse_id || !to_warehouse_id) throw new Error('المستودعان مطلوبان');
    if (from_warehouse_id === to_warehouse_id) throw new Error('لا يمكن التحويل لنفس المستودع');

    return db.transaction(() => {
      const transferNumber = generateDocumentNumber('stock_movements', 'reference_id', 'ST-');
      let totalItems = 0;

      for (const item of items) {
        const stock = db.prepare('SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?').get(item.product_id, from_warehouse_id);
        if (!stock || Number(stock.quantity) < Number(item.qty)) throw new Error(`المخزون غير كافٍ للمنتج في المستودع`);

        db.prepare('UPDATE stock_levels SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ?').run(item.qty, item.product_id, from_warehouse_id);

        const existing = db.prepare('SELECT id FROM stock_levels WHERE product_id = ? AND warehouse_id = ?').get(item.product_id, to_warehouse_id);
        if (existing) {
          db.prepare('UPDATE stock_levels SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?').run(item.qty, item.product_id, to_warehouse_id);
        } else {
          db.prepare('INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES (?, ?, ?)').run(item.product_id, to_warehouse_id, item.qty);
        }

        const product = db.prepare('SELECT name FROM products WHERE id = ?').get(item.product_id);
        db.prepare(`INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'transfer', ?, ?, ?, ?, ?)`).run(
          branch_id, item.product_id, from_warehouse_id, item.qty, 'stock_transfer', 0, `${product?.name || ''} → ${transferNumber}`, created_by
        );

        totalItems++;
      }

      return { success: true, items_transferred: totalItems, transfer_number: transferNumber };
    })();
  }
}

module.exports = new WarehouseService();
