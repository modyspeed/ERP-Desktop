const quotationService = require('../services/quotation.service');

function registerQuotationIpc(ipcMain) {
  ipcMain.handle('quotations:search', async (event, params) => {
    try { return { success: true, data: quotationService.searchQuotations(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('quotations:options', async (event, branchId) => {
    try { return { success: true, data: quotationService.getFormOptions(branchId || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('quotations:save', async (event, data) => {
    try { return { success: true, data: quotationService.saveQuotation(data), message: 'تم حفظ عرض الأسعار بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('quotations:get', async (event, id) => {
    try { return { success: true, data: quotationService.getQuotation(id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('quotations:convert-to-invoice', async (event, data) => {
    try { return { success: true, data: quotationService.convertToInvoice(data.quotation_id, data), message: 'تم تحويل العرض لفاتورة بيع وتحديث المخزون' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerQuotationIpc;
