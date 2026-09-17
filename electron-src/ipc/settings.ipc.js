const settingService = require('../services/setting.service');

function registerSettingsIPC(ipcMain) {
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = settingService.getSettings();
      return { success: true, data: settings };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('settings:update', async (event, { data, currentUserId }) => {
    try {
      const updated = settingService.updateSettings(data, currentUserId);
      return { success: true, data: updated, message: 'تم حفظ الإعدادات بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('settings:upload-logo', async (event, { fileBuffer, fileName, currentUserId }) => {
    try {
      const updated = settingService.saveLogo({ fileBuffer, fileName, currentUserId });
      return { success: true, data: updated, message: 'تم تحديث الشعار بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Branches
  ipcMain.handle('branches:list', async () => {
    try {
      const branches = settingService.getAllBranches();
      return { success: true, data: branches };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('branches:save', async (event, branchData) => {
    try {
      const branches = settingService.saveBranch(branchData);
      return { success: true, data: branches, message: 'تم حفظ الفرع بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('branches:delete', async (event, { id, currentUserId }) => {
    try {
      settingService.deleteBranch(id, currentUserId);
      const branches = settingService.getAllBranches();
      return { success: true, data: branches, message: 'تم حذف الفرع بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerSettingsIPC;
