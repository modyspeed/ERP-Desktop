const purchaseOrderService = require('../services/purchase_order.service');
const permissionMiddleware = require('./permission.middleware');

function registerPurchaseOrderIpc(ipcMain) {
  ipcMain.handle('purchase-orders:search', async (event, params) => {
    try { return { success: true, data: purchaseOrderService.searchPurchaseOrders(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchase-orders:options', async (event, branchId) => {
    try { return { success: true, data: purchaseOrderService.getFormOptions(branchId || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchase-orders:get', async (event, data) => {
    try { return { success: true, data: purchaseOrderService.getPurchaseOrder(data.id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchase-orders:save', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'purchases', 'create') && !permissionMiddleware.hasPermission(userId, 'purchases', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية إنشاء/تعديل أوامر الشراء', code: 'FORBIDDEN' };
    }
    try {
      const result = purchaseOrderService.savePurchaseOrder({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم حفظ أمر الشراء بنجاح' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchase-orders:convert-to-invoice', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'purchases', 'create')) {
      return { success: false, error: 'لا تمتلك صلاحية إنشاء فواتير شراء', code: 'FORBIDDEN' };
    }
    try {
      const result = purchaseOrderService.convertToInvoice(data.po_id, { ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم إنشاء فاتورة شراء وتحديث المخزون' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerPurchaseOrderIpc;