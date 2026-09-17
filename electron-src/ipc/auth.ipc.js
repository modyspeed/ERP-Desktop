const authService = require('../services/auth.service');

function registerAuthIPC(ipcMain) {
  ipcMain.handle('auth:login', async (event, credentials) => {
    try {
      const user = await authService.login(credentials);
      return { success: true, data: user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:change-password', async (event, params) => {
    try {
      await authService.changePassword(params);
      return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:get-current-user', async (event, userId) => {
    try {
      const user = authService.getCurrentUser(userId);
      return { success: true, data: user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerAuthIPC;
