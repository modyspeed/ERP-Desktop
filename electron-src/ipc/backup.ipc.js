const backupService = require('../services/backup.service');
const permissionMiddleware = require('./permission.middleware');

function registerBackupIpc(ipcMain) {
  ipcMain.handle('backup:list', async () => {
    try { return { success: true, data: backupService.listBackups() }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('backup:create', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'backup', 'create') && !permissionMiddleware.hasPermission(userId, 'backup', 'manage')) {
      return { success: false, error: 'لا تمتلك صلاحية إنشاء نسخ افتراضي', code: 'FORBIDDEN' };
    }
    try {
      const result = backupService.backup(userId);
      return { success: true, data: result, message: 'تم انشاء النسخ Backup' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('backup:restore', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'backup', 'restore') && !permissionMiddleware.hasPermission(userId, 'backup', 'manage')) {
      return { success: false, error: 'لا تمتلك صلاحية استعادة النسخ Backup', code: 'FORBIDDEN' };
    }
    try {
      const result = backupService.restore(data.filePath, userId);
      return { success: true, data: result, message: 'تمت استعادة النسخ Backup' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('backup:delete', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'backup', 'delete') && !permissionMiddleware.hasPermission(userId, 'backup', 'manage')) {
      return { success: false, error: 'لا تمتلك صلاحية حذف النسخ Backup', code: 'FORBIDDEN' };
    }
    try {
      const result = backupService.deleteBackup(data.filePath, userId);
      return { success: true, data: result, message: 'تم حذف النسخ Backup' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('backup:schedule', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'backup', 'manage')) {
      return { success: false, error: 'لا تمتلك صلاحية جدولة النسخ Backup', code: 'FORBIDDEN' };
    }
    try {
      const { intervalMinutes = 60 } = data || {};
      const intervalId = setInterval(() => {
        try { backupService.backup(userId); } catch {}
      }, intervalMinutes * 60 * 1000);
      return { success: true, intervalId, message: 'تم تفعيل جدول النسخ Backup' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerBackupIpc;