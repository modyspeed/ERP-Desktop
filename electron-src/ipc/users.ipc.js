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
    const userId = typeof id === 'object' && id !== null ? id.id : id;
    try {
      const user = userService.getUser(userId);
      return { success: true, data: user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:create', async (event, userData) => {
    try {
      const currentUserId = userData?._userId || userData?.currentUserId;
      const created = userService.createUser({ ...userData, currentUserId });
      return { success: true, data: created, message: 'تم إنشاء المستخدم بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:update', async (event, userData) => {
    try {
      const { id, _userId, ...data } = userData || {};
      const currentUserId = _userId || data.currentUserId;
      const updated = userService.updateUser(id, { ...data, currentUserId });
      return { success: true, data: updated, message: 'تم تحديث بيانات المستخدم بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:delete', async (event, data) => {
    try {
      const { id, currentUserId, _userId } = data || {};
      userService.deleteUser(id, _userId || currentUserId);
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
      const currentUserId = roleData?._userId || roleData?.currentUserId;
      const roles = userService.saveRole({ ...roleData, currentUserId });
      return { success: true, data: roles, message: 'تم حفظ الدور والصلاحيات بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('roles:delete', async (event, data) => {
    try {
      const { id, currentUserId, _userId } = data || {};
      userService.deleteRole(id, _userId || currentUserId);
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
