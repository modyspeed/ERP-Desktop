const warehouseService = require('../services/warehouse.service');
const permissionMiddleware = require('./permission.middleware');

function registerWarehouseIpc(ipcMain) {
  ipcMain.handle('warehouses:search', async (event, params) => {
    try { return { success: true, data: warehouseService.searchWarehouses(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('warehouses:stock', async (event, data) => {
    const warehouseId = typeof data === 'number' ? data : data?.warehouseId;
    try { return { success: true, data: warehouseService.getWarehouseStock(warehouseId) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('warehouses:save', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'inventory', 'create') && !permissionMiddleware.hasPermission(userId, 'inventory', 'edit')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const result = warehouseService.saveWarehouse({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'Warehouse saved' };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('warehouses:transfer', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'inventory', 'edit')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const result = warehouseService.transferStock({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'Stock transferred' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerWarehouseIpc;