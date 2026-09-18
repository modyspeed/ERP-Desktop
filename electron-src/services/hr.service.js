const hrRepository = require('../repositories/hr.repository');

class HrService {
  searchEmployees(params) { return hrRepository.searchEmployees(params || {}); }
  getFormOptions(branchId) { return hrRepository.getFormOptions(branchId || 1); }
  saveEmployee(data) {
    if (!data.full_name || !data.full_name.trim()) throw new Error('الاسم الكامل مطلوب');
    return hrRepository.saveEmployee(data);
  }
  deleteEmployee(id) {
    if (!id) throw new Error('معرّف الموظف مطلوب');
    return hrRepository.softDelete(id);
  }
  getAttendance(params) { return hrRepository.getAttendance(params || {}); }
  getAttendanceSummary(params) { return hrRepository.getAttendanceSummary(params || {}); }
  upsertAttendance(data) { return hrRepository.upsertAttendance(data); }
  getLeaves(params) { return hrRepository.getLeaves(params || {}); }
  saveLeave(data) {
    if (!data.employee_id) throw new Error('الموظف مطلوب');
    if (!data.leave_type) throw new Error('نوع الإجازة مطلوب');
    if (!data.start_date || !data.end_date) throw new Error('تاريخ البداية والنهاية مطلوبان');
    return hrRepository.saveLeave(data);
  }
  getPayrolls(params) { return hrRepository.getPayrolls(params || {}); }
  generatePayroll(data) { return hrRepository.generatePayroll(data); }
}

module.exports = new HrService();
