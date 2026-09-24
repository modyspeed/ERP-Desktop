const purchaseService = require('../services/purchase.service');

function registerPurchasesIPC(ipcMain) {
  ipcMain.handle('purchases:invoices', async (event, params) => {
    try { return { success: true, data: purchaseService.listInvoices(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchases:options', async (event, branchId) => {
    const id = typeof branchId === 'object' && branchId !== null ? branchId.id : branchId;
    try { return { success: true, data: purchaseService.getFormOptions(id || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchases:create-invoice', async (event, data) => {
    try { return { success: true, data: purchaseService.createInvoice(data), message: 'تم إنشاء فاتورة الشراء وزيادة المخزون' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchases:collect-payment', async (event, data) => {
    try {
      const result = purchaseService.collectPayment(data);
      const withheld = Number(result?.withholding_amount || 0);
      const message = withheld > 0
        ? `تم سداد الفاتورة: صافي ${Number(result.cash_paid).toFixed(2)} للمورد + خصم ضريبة الخصم والإضافة ${withheld.toFixed(2)} (${result.withholding_rate}%)`
        : 'تم سداد الفاتورة بالكامل';
      return { success: true, data: result, message };
    }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerPurchasesIPC;