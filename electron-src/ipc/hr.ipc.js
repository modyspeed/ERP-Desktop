const hrService = require('../services/hr.service');
const permissionMiddleware = require('./permission.middleware');

function registerHrIpc(ipcMain) {
  ipcMain.handle('hr:employees-search', async (event, params) => {
    try { return { success: true, data: hrService.searchEmployees(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('hr:employees-options', async (event, branchId) => {
    const id = typeof branchId === 'object' && branchId !== null ? branchId.id : branchId;
    try { return { success: true, data: hrService.getFormOptions(id || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('hr:employee-save', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'غير مصرح لك', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'create') && !permissionMiddleware.hasPermission(userId, 'hr', 'edit')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const { _userId, ...employeeData } = data || {};
      const result = hrService.saveEmployee({ ...employeeData, currentUserId: userId });
      return { success: true, data: result, message: 'Employee saved' };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('hr:employee-delete', async (event, data) => {
    const id = typeof data === 'number' ? data : data?.id;
    const userId = typeof data === 'number' ? null : data?._userId;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'delete')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      hrService.deleteEmployee(id, userId);
      return { success: true, message: 'Employee deleted' };
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
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'edit')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const { _userId, ...attendanceData } = data || {};
      const result = hrService.upsertAttendance({ ...attendanceData, currentUserId: userId });
      return { success: true, data: result, message: 'Attendance saved' };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('hr:leaves-search', async (event, params) => {
    try { return { success: true, data: hrService.getLeaves(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('hr:leave-save', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'create') && !permissionMiddleware.hasPermission(userId, 'hr', 'edit')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const { _userId, ...leaveData } = data || {};
      const result = hrService.saveLeave({ ...leaveData, currentUserId: userId });
      return { success: true, data: result, message: 'Leave saved' };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('hr:payrolls-search', async (event, params) => {
    try { return { success: true, data: hrService.getPayrolls(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('hr:payroll-generate', async (event, data) => {
    const userId = data?._userId || null;
    if (!userId) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
    if (!permissionMiddleware.hasPermission(userId, 'hr', 'create')) {
      return { success: false, error: 'Forbidden', code: 'FORBIDDEN' };
    }
    try {
      const { _userId, ...payrollData } = data || {};
      const result = hrService.generatePayroll({ ...payrollData, currentUserId: userId });
      return { success: true, data: result, message: 'Payroll generated' };
    } catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerHrIpc;