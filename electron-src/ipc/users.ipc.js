const userService = require('../services/user.service');

function registerUsersIPC(ipcMain) {
  ipcMain.handle('users:search', async (event, params) => {
    try {
      const result = userService.searchUsers(params || {});
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:get', async (event, id) => {
    try {
      const user = userService.getUser(id);
      return { success: true, data: user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:create', async (event, userData) => {
    try {
      const created = userService.createUser(userData);
      return { success: true, data: created, message: 'تم إنشاء المستخدم بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:update', async (event, { id, ...userData }) => {
    try {
      const updated = userService.updateUser(id, userData);
      return { success: true, data: updated, message: 'تم تحديث بيانات المستخدم بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:delete', async (event, { id, currentUserId }) => {
    try {
      userService.deleteUser(id, currentUserId);
      return { success: true, message: 'تم حذف المستخدم بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Roles & Permissions
  ipcMain.handle('roles:list', async () => {
    try {
      const roles = userService.getAllRoles();
      return { success: true, data: roles };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('roles:save', async (event, roleData) => {
    try {
      const roles = userService.saveRole(roleData);
      return { success: true, data: roles, message: 'تم حفظ الدور والصلاحيات بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('roles:delete', async (event, { id, currentUserId }) => {
    try {
      userService.deleteRole(id, currentUserId);
      return { success: true, message: 'تم حذف الدور بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('permissions:list', async () => {
    try {
      const perms = userService.getAllPermissionsGrouped();
      return { success: true, data: perms };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerUsersIPC;
