const quotationService = require('../services/quotation.service');
const permissionMiddleware = require('./permission.middleware');

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
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'sales', 'create') && !permissionMiddleware.hasPermission(userId, 'sales', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية إضافة/تعديل عروض الأسعار', code: 'FORBIDDEN' };
    }
    try {
      const result = quotationService.saveQuotation({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم حفظ عرض الأسعار بنجاح' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('quotations:get', async (event, data) => {
    try { return { success: true, data: quotationService.getQuotation(data.id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('quotations:convert-to-invoice', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'sales', 'create')) {
      return { success: false, error: 'لا تمتلك صلاحية تحويل العرض لفاتورة', code: 'FORBIDDEN' };
    }
    try {
      const result = quotationService.convertToInvoice(data.quotation_id, { ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم تحويل العرض لفاتورة بيع وتحديث المخزون' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerQuotationIpc;