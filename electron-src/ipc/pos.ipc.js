const posService = require('../services/pos.service');

function registerPosIPC(ipcMain) {
  ipcMain.handle('pos:active-session', async (event, params) => {
    const { _userId, currentUserId, cashier_id, branch_id } = params || {};
    try {
      const cashierId = cashier_id || _userId || currentUserId;
      return { success: true, data: posService.getActiveSession({ cashier_id: cashierId, branch_id }) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pos:open-session', async (event, data) => {
    const { _userId, currentUserId, ...sessionData } = data || {};
    try {
      return {
        success: true,
        data: posService.openSession(sessionData, _userId || currentUserId),
        message: 'تم فتح الوردية بنجاح',
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pos:close-session', async (event, data) => {
    const { _userId, currentUserId, ...closeData } = data || {};
    try {
      return {
        success: true,
        data: posService.closeSession(closeData, _userId || currentUserId),
        message: 'تم إغلاق الوردية وتسوية الصندوق',
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pos:session-stats', async (event, params) => {
    const { id } = params || {};
    try {
      return { success: true, data: posService.getSessionStats(id) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerPosIPC;
