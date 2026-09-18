const warehouseService = require('../services/warehouse.service');

function registerWarehouseIpc(ipcMain) {
  ipcMain.handle('warehouses:search', async (event, params) => {
    try { return { success: true, data: warehouseService.searchWarehouses(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('warehouses:stock', async (event, warehouseId) => {
    try { return { success: true, data: warehouseService.getWarehouseStock(warehouseId) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('warehouses:save', async (event, data) => {
    try { return { success: true, data: warehouseService.saveWarehouse(data), message: 'تم حفظ المستودع بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('warehouses:transfer', async (event, data) => {
    try { return { success: true, data: warehouseService.transferStock(data), message: 'تم تحويل المخزون بين المستودعات بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerWarehouseIpc;
