const hrRepository = require('../repositories/hr.repository');
const auditRepository = require('../repositories/audit.repository');

class HrService {
  searchEmployees(params) { return hrRepository.searchEmployees(params || {}); }
  getFormOptions(branchId) { return hrRepository.getFormOptions(branchId || 1); }

  saveEmployee(data) {
    if (!data.full_name || !data.full_name.trim()) throw new Error('Full name is required');
    const existing = data.id ? hrRepository.findById(data.id) : null;
    const result = hrRepository.saveEmployee(data);

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'hr',
      action: data.id ? 'update' : 'create',
      recordId: result.id,
      oldValue: existing ? { full_name: existing.full_name, phone: existing.phone } : null,
      newValue: { id: result.id, full_name: result.full_name, position: result.position },
    });

    return result;
  }

  deleteEmployee(id, currentUserId) {
    if (!id) throw new Error('Employee ID is required');
    const emp = hrRepository.findById(id);
    if (!emp) throw new Error('Employee not found');

    hrRepository.softDelete(id);

    auditRepository.log({
      userId: currentUserId || null,
      module: 'hr',
      action: 'delete',
      recordId: id,
      oldValue: { id: emp.id, full_name: emp.full_name },
      newValue: { is_deleted: 1 },
    });

    return true;
  }

  getAttendance(params) { return hrRepository.getAttendance(params || {}); }
  getAttendanceSummary(params) { return hrRepository.getAttendanceSummary(params || {}); }

  upsertAttendance(data) {
    const existing = hrRepository.findById(data.id);
    const result = hrRepository.upsertAttendance(data);

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'hr',
      action: data.id ? 'update' : 'create',
      recordId: result.id,
      oldValue: existing ? { date: existing.date, status: existing.status } : null,
      newValue: { id: result.id, date: result.date, status: result.status },
    });

    return result;
  }

  getLeaves(params) { return hrRepository.getLeaves(params || {}); }

  saveLeave(data) {
    if (!data.employee_id) throw new Error('Employee is required');
    if (!data.leave_type) throw new Error('Leave type is required');
    if (!data.start_date || !data.end_date) throw new Error('Start and end dates are required');
    if (new Date(data.end_date) < new Date(data.start_date)) throw new Error('End date must be after start date');

    const existing = data.id ? hrRepository.findById(data.id) : null;
    const result = hrRepository.saveLeave(data);

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'hr',
      action: data.id ? 'update' : 'create',
      recordId: result.id,
      oldValue: existing ? { leave_type: existing.leave_type, status: existing.status } : null,
      newValue: { id: result.id, leave_type: result.leave_type, status: result.status },
    });

    return result;
  }

  getPayrolls(params) { return hrRepository.getPayrolls(params || {}); }

  generatePayroll(data) {
    const result = hrRepository.generatePayroll(data);

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'hr',
      action: 'create',
      recordId: result.payroll?.id,
      oldValue: null,
      newValue: { id: result.payroll?.id, employee_id: data.employee_id, month: result.payroll?.month, net_salary: result.payroll?.net_salary, journal_entry_id: result.journal_entry_id },
    });

    return result;
  }
}

module.exports = new HrService();