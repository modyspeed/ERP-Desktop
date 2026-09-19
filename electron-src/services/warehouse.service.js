const warehouseRepository = require('../repositories/warehouse.repository');
const auditRepository = require('../repositories/audit.repository');

class WarehouseService {
  searchWarehouses(params) { return warehouseRepository.searchWarehouses(params || {}); }
  getWarehouseStock(warehouseId) { return warehouseRepository.getWarehouseStock(warehouseId); }

  saveWarehouse(data) {
    const existing = data.id ? warehouseRepository.findById(data.id) : null;
    const result = warehouseRepository.saveWarehouse({ ...data, currentUserId: data.currentUserId || null });

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'inventory',
      action: data.id ? 'update' : 'create',
      recordId: result.id,
      oldValue: existing ? { name: existing.name, location: existing.location } : null,
      newValue: { id: result.id, name: result.name, location: result.location },
    });

    return result;
  }

  transferStock(data) {
    const result = warehouseRepository.transferStock({ ...data, currentUserId: data.currentUserId || null });

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'inventory',
      action: 'transfer',
      recordId: result.transfer_number,
      oldValue: null,
      newValue: { from_warehouse_id: data.from_warehouse_id, to_warehouse_id: data.to_warehouse_id, items_transferred: result.items_transferred },
    });

    return result;
  }
}

module.exports = new WarehouseService();