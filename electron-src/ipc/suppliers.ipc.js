const supplierService = require('../services/supplier.service');

function registerSuppliersIPC(ipcMain) {
  ipcMain.handle('suppliers:search', async (event, params) => {
    try { return { success: true, data: supplierService.searchSuppliers(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('suppliers:save', async (event, data) => {
    try { return { success: true, data: supplierService.saveSupplier(data), message: 'تم حفظ بيانات المورد بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('suppliers:delete', async (event, id) => {
    try { supplierService.deleteSupplier(id); return { success: true, message: 'تم حذف المورد بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerSuppliersIPC;