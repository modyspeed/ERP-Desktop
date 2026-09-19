const warehouseService = require('../services/warehouse.service');
const permissionMiddleware = require('./permission.middleware');

function registerWarehouseIpc(ipcMain) {
  ipcMain.handle('warehouses:search', async (event, params) => {
    try { return { success: true, data: warehouseService.searchWarehouses(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('warehouses:stock', async (event, data) => {
    try { return { success: true, data: warehouseService.getWarehouseStock(data.warehouseId) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('warehouses:save', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'inventory', 'create') && !permissionMiddleware.hasPermission(userId, 'inventory', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية إضافة/تعديل مستودعات', code: 'FORBIDDEN' };
    }
    try {
      const result = warehouseService.saveWarehouse({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم حفظ المستودع' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('warehouses:transfer', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'inventory', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية تحويل المخزون', code: 'FORBIDDEN' };
    }
    try {
      const result = warehouseService.transferStock({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم تحويل المخزون' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerWarehouseIpc;