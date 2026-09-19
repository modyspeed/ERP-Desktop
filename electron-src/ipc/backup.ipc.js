const backupService = require('../services/backup.service');
const permissionMiddleware = require('./permission.middleware');

function registerBackupIpc(ipcMain) {
  ipcMain.handle('backup:list', async () => {
    try { return { success: true, data: backupService.listBackups() }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('backup:create', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'backup', 'create') && !permissionMiddleware.hasPermission(userId, 'backup', 'manage')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const result = backupService.backup(userId);
      return { success: true, data: result, message: 'Backup created' };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('backup:restore', async (event, data) => {
    const filePath = typeof data === 'string' ? data : data?.filePath;
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'backup', 'restore') && !permissionMiddleware.hasPermission(userId, 'backup', 'manage')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const result = backupService.restore(filePath, userId);
      return { success: true, data: result, message: 'Backup restored' };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('backup:delete', async (event, data) => {
    const filePath = typeof data === 'string' ? data : data?.filePath;
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'backup', 'delete') && !permissionMiddleware.hasPermission(userId, 'backup', 'manage')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const result = backupService.deleteBackup(filePath, userId);
      return { success: true, data: result, message: 'Backup deleted' };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('backup:schedule', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'backup', 'manage')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const { intervalMinutes = 60 } = data || {};
      const intervalId = setInterval(() => {
        try { backupService.backup(userId); } catch {}
      }, intervalMinutes * 60 * 1000);
      return { success: true, intervalId, message: 'Backup scheduled' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerBackupIpc;