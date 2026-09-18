const returnService = require('../services/return.service');

function registerReturnIpc(ipcMain) {
  ipcMain.handle('returns:sales-search', async (event, params) => {
    try { return { success: true, data: returnService.searchSalesReturns(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:sales-get', async (event, id) => {
    try { return { success: true, data: returnService.getSalesReturn(id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:sales-create', async (event, data) => {
    try { return { success: true, data: returnService.createSalesReturn(data), message: 'تم إنشاء مرتجع البيع وتحديث المخزون' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:purchases-search', async (event, params) => {
    try { return { success: true, data: returnService.searchPurchaseReturns(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:purchases-get', async (event, id) => {
    try { return { success: true, data: returnService.getPurchaseReturn(id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:purchases-create', async (event, data) => {
    try { return { success: true, data: returnService.createPurchaseReturn(data), message: 'تم إنشاء مرتجع الشراء وتحديث المخزون' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerReturnIpc;
