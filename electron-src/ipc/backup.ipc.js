const backupService = require('../services/backup.service');

function registerBackupIpc(ipcMain) {
  ipcMain.handle('backup:list', async () => {
    try { return { success: true, data: backupService.listBackups() }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('backup:create', async () => {
    try { return { success: true, data: backupService.backup(), message: 'تم إنشاء النسخة الاحتياطية بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('backup:restore', async (event, filePath) => {
    try { return { success: true, data: backupService.restore(filePath), message: 'تم استعادة النسخة الاحتياطية بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('backup:delete', async (event, filePath) => {
    try { backupService.deleteBackup(filePath); return { success: true, message: 'تم حذف النسخة الاحتياطية' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('backup:schedule', async (event, { intervalMinutes }) => {
    try {
      // Schedule backup using setInterval
      const interval = setInterval(() => {
        try { backupService.backup(); } catch (e) { console.error('Scheduled backup failed:', e); }
      }, intervalMinutes * 60 * 1000);
      return { success: true, intervalId: interval, message: `تم جدولة النسخ الاحتياطي كل ${intervalMinutes} دقائق` };
    } catch (err) { return { success: false, error: err.message }; }
  });
  return { success: true };
}

module.exports = registerBackupIpc;
