const returnService = require('../services/return.service');
const permissionMiddleware = require('./permission.middleware');

function registerReturnIpc(ipcMain) {
  ipcMain.handle('returns:sales-search', async (event, params) => {
    try { return { success: true, data: returnService.searchSalesReturns(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('returns:sales-get', async (event, data) => {
    const id = typeof data === 'number' ? data : data?.id;
    try { return { success: true, data: returnService.getSalesReturn(id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('returns:sales-create', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'sales', 'create') && !permissionMiddleware.hasPermission(userId, 'sales', 'edit')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const result = returnService.createSalesReturn({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'Sales return created' };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('returns:purchases-search', async (event, params) => {
    try { return { success: true, data: returnService.searchPurchaseReturns(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('returns:purchases-get', async (event, data) => {
    const id = typeof data === 'number' ? data : data?.id;
    try { return { success: true, data: returnService.getPurchaseReturn(id) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('returns:purchases-create', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'purchases', 'create') && !permissionMiddleware.hasPermission(userId, 'purchases', 'edit')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const result = returnService.createPurchaseReturn({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'Purchase return created' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerReturnIpc;