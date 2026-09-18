const hrService = require('../services/hr.service');

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
    try { return { success: true, data: hrService.saveEmployee(data), message: 'تم حفظ بيانات الموظف بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:employee-delete', async (event, id) => {
    try { hrService.deleteEmployee(id); return { success: true, message: 'تم حذف الموظف بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
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
    try { return { success: true, data: hrService.upsertAttendance(data), message: 'تم حفظ سجل الحضور' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:leaves-search', async (event, params) => {
    try { return { success: true, data: hrService.getLeaves(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:leave-save', async (event, data) => {
    try { return { success: true, data: hrService.saveLeave(data), message: 'تم حفظ طلب الإجازة بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:payrolls-search', async (event, params) => {
    try { return { success: true, data: hrService.getPayrolls(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('hr:payroll-generate', async (event, data) => {
    try { return { success: true, data: hrService.generatePayroll(data), message: 'تم إنشاء كشف الرواتب وربطه بقيد محاسبي' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerHrIpc;
