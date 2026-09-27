const reportService = require('../services/report.service');
const permissionMiddleware = require('./permission.middleware');

function registerReportIpc(ipcMain) {
  ipcMain.handle('reports:profit-loss', async (event, params) => {
    const userId = params?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'reports', 'view')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try { return { success: true, data: reportService.profitLoss(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('reports:inventory-movement', async (event, params) => {
    const userId = params?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'reports', 'view')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try { return { success: true, data: reportService.inventoryMovement(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('reports:tax-report', async (event, params) => {
    const userId = params?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'reports', 'view')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try { return { success: true, data: reportService.taxReport(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('reports:sales-summary', async (event, params) => {
    const userId = params?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'reports', 'view')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try { return { success: true, data: reportService.salesSummary(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('reports:trial-balance', async (event, params) => {
    const userId = params?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'reports', 'view')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try { return { success: true, data: reportService.trialBalance(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('reports:income-statement', async (event, params) => {
    const userId = params?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'reports', 'view')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try { return { success: true, data: reportService.incomeStatement(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('reports:balance-sheet', async (event, params) => {
    const userId = params?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'reports', 'view')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try { return { success: true, data: reportService.balanceSheet(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerReportIpc;