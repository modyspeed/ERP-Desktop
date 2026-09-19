const returnService = require('../services/return.service');
const permissionMiddleware = require('./permission.middleware');

function registerReturnIpc(ipcMain) {
  ipcMain.handle('returns:sales-search', async (event, params) => {
    try { return { success: true, data: returnService.searchSalesReturns(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:sales-get', async (event, data) => {
    try { return { success: true, data: returnService.getSalesReturn(data.id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:sales-create', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'sales', 'create') && !permissionMiddleware.hasPermission(userId, 'sales', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية إنشاء مرتجعات بيع', code: 'FORBIDDEN' };
    }
    try {
      const result = returnService.createSalesReturn({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم حفظ مرتجع البيع' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:purchases-search', async (event, params) => {
    try { return { success: true, data: returnService.searchPurchaseReturns(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:purchases-get', async (event, data) => {
    try { return { success: true, data: returnService.getPurchaseReturn(data.id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('returns:purchases-create', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'purchases', 'create') && !permissionMiddleware.hasPermission(userId, 'purchases', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية إنشاء مرتجعات شراء', code: 'FORBIDDEN' };
    }
    try {
      const result = returnService.createPurchaseReturn({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم حفظ مرتجع الشراء' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerReturnIpc;