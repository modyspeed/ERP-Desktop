const auditService = require('../services/audit.service');

function registerAuditIPC(ipcMain) {
  ipcMain.handle('audit:search', async (event, params) => {
    try {
      const result = auditService.searchLogs(params || {});
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('audit:modules', async () => {
    try {
      const modules = auditService.getModules();
      return { success: true, data: modules };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerAuditIPC;
