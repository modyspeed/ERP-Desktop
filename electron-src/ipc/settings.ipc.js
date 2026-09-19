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

  ipcMain.handle('settings:update', async (event, params) => {
    try {
      const { data, currentUserId, _userId } = params || {};
      const updated = settingService.updateSettings(data, _userId || currentUserId);
      return { success: true, data: updated, message: 'تم حفظ الإعدادات بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('settings:upload-logo', async (event, params) => {
    try {
      const { fileBuffer, fileName, currentUserId, _userId } = params || {};
      const updated = settingService.saveLogo({ fileBuffer, fileName, currentUserId: _userId || currentUserId });
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
      const { _userId, ...data } = branchData || {};
      const branches = settingService.saveBranch({ ...data, currentUserId: _userId || data.currentUserId });
      return { success: true, data: branches, message: 'تم حفظ الفرع بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('branches:delete', async (event, data) => {
    try {
      const { id, currentUserId, _userId } = data || {};
      settingService.deleteBranch(id, _userId || currentUserId);
      const branches = settingService.getAllBranches();
      return { success: true, data: branches, message: 'تم حذف الفرع بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerSettingsIPC;
