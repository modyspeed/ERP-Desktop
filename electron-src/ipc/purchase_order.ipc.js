const purchaseOrderService = require('../services/purchase_order.service');

function registerPurchaseOrderIpc(ipcMain) {
  ipcMain.handle('purchase-orders:search', async (event, params) => {
    try { return { success: true, data: purchaseOrderService.searchPurchaseOrders(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchase-orders:options', async (event, branchId) => {
    try { return { success: true, data: purchaseOrderService.getFormOptions(branchId || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchase-orders:get', async (event, id) => {
    try { return { success: true, data: purchaseOrderService.getPurchaseOrder(id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchase-orders:save', async (event, data) => {
    try { return { success: true, data: purchaseOrderService.savePurchaseOrder(data), message: 'تم حفظ أمر الشراء بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('purchase-orders:convert-to-invoice', async (event, data) => {
    try { return { success: true, data: purchaseOrderService.convertToInvoice(data.po_id, data), message: 'تم إنشاء فاتورة شراء وتحديث المخزون' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerPurchaseOrderIpc;
