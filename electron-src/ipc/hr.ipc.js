const hrService = require('../services/hr.service');
const permissionMiddleware = require('./permission.middleware');

function registerHrIpc(ipcMain) {
  ipcMain.handle('hr:employees-search', async (event, params) => {
    try { return { success: true, data: hrService.searchEmployees(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:employees-options', async (event, branchId) => {
    try { return { success: true, data: hrService.getFormOptions(branchId || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:employee-save', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'create') && !permissionMiddleware.hasPermission(userId, 'hr', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية إضافة/تعديل موظفين', code: 'FORBIDDEN' };
    }
    try {
      const result = hrService.saveEmployee({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم حفظ الموظف بنجاح' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:employee-delete', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'delete')) {
      return { success: false, error: 'لا تمتلك صلاحية حذف موظفين', code: 'FORBIDDEN' };
    }
    try {
      hrService.deleteEmployee(data.id, userId);
      return { success: true, message: 'تم حذف الموظف' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:attendance-search', async (event, params) => {
    try { return { success: true, data: hrService.getAttendance(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:attendance-summary', async (event, params) => {
    try { return { success: true, data: hrService.getAttendanceSummary(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:attendance-upsert', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية تعديل الحضور', code: 'FORBIDDEN' };
    }
    try {
      const result = hrService.upsertAttendance({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم حفظ الحضور' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:leaves-search', async (event, params) => {
    try { return { success: true, data: hrService.getLeaves(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:leave-save', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'create') && !permissionMiddleware.hasPermission(userId, 'hr', 'edit')) {
      return { success: false, error: 'لا تمتلك صلاحية إضافة/تعديل الإجازات', code: 'FORBIDDEN' };
    }
    try {
      const result = hrService.saveLeave({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم حفظ الإجازة' };
    } catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:payrolls-search', async (event, params) => {
    try { return { success: true, data: hrService.getPayrolls(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:payroll-generate', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'create')) {
      return { success: false, error: 'لا تمتلك صلاحية إنشاء الرواتب', code: 'FORBIDDEN' };
    }
    try {
      const result = hrService.generatePayroll({ ...data, currentUserId: userId });
      return { success: true, data: result, message: 'تم توليد قيد الرواتب' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerHrIpc;