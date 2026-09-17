const salesService = require('../services/sales.service');

function registerSalesIPC(ipcMain) {
  ipcMain.handle('sales:invoices', async (event, params) => {
    try { return { success: true, data: salesService.listInvoices(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('sales:options', async (event, branchId) => {
    try { return { success: true, data: salesService.getFormOptions(branchId || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('sales:create-invoice', async (event, data) => {
    try { return { success: true, data: salesService.createInvoice(data), message: 'تم إنشاء فاتورة البيع وتحديث المخزون' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerSalesIPC;