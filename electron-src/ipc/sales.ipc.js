const salesService = require('../services/sales.service');

function registerSalesIPC(ipcMain) {
  ipcMain.handle('sales:invoices', async (event, params) => {
    try { return { success: true, data: salesService.listInvoices(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('sales:options', async (event, branchId) => {
    const id = typeof branchId === 'object' && branchId !== null ? branchId.id : branchId;
    try { return { success: true, data: salesService.getFormOptions(id || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('sales:create-invoice', async (event, data) => {
    try { return { success: true, data: salesService.createInvoice(data), message: 'تم إنشاء فاتورة البيع وتحديث المخزون' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('sales:unpaid-invoices', async (event, params) => {
    try { return { success: true, data: salesService.listUnpaidInvoices(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('sales:collect-payment', async (event, data) => {
    const { _userId, currentUserId, ...paymentData } = data || {};
    try {
      return {
        success: true,
        data: salesService.collectPayment({ ...paymentData, created_by: _userId || currentUserId }),
        message: 'تم تسجيل التحصيل وتحديث الفاتورة',
      };
    }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerSalesIPC;