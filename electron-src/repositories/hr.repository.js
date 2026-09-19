const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');
const { generateDocumentNumber } = require('../utils/numbering');

class HrRepository extends BaseRepository {
  constructor() {
    super('employees');
  }

  searchEmployees({ query = '', branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `SELECT * FROM employees WHERE is_deleted = 0 AND branch_id = ?`;
    const params = [branch_id];
    if (query.trim()) {
      sql += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR position LIKE ? OR department LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search, search, search, search);
    }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getFormOptions(branchId = 1) {
    return {
      departments: this.db.prepare('SELECT DISTINCT department FROM employees WHERE branch_id = ? AND is_deleted = 0 AND department IS NOT NULL ORDER BY department').all(branchId).map(r => r.department),
    };
  }

  saveEmployee({ id, branch_id = 1, currentUserId, _userId, ...data }) {
    const employee = {
      ...data,
      branch_id,
      salary_base: Number(data.salary_base || 0),
      is_active: data.is_active === undefined ? 1 : Number(data.is_active),
    };
    return id ? this.update(id, employee) : this.create(employee);
  }

  getAttendance({ employee_id, date, branch_id = 1, page = 1, limit = 30 } = {}) {
    let sql = `SELECT a.*, e.full_name AS employee_name FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id WHERE a.employee_id IS NOT NULL`;
    const params = [];
    if (employee_id) { sql += ' AND a.employee_id = ?'; params.push(employee_id); }
    if (date) { sql += ' AND a.date = ?'; params.push(date); }
    if (branch_id) { sql += ' AND e.branch_id = ?'; params.push(branch_id); }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY a.date DESC, a.check_in DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getAttendanceSummary({ employee_id, month, year } = {}) {
    const params = [];
    let sql = `SELECT COUNT(*) as total_days, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days, SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days, SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id WHERE 1=1`;
    if (employee_id) { sql += ' AND a.employee_id = ?'; params.push(employee_id); }
    if (month && year) { sql += " AND strftime('%Y-%m', a.date) = ?"; params.push(`${year}-${String(month).padStart(2, '0')}`); }
    const result = this.db.prepare(sql).get(...params);
    return result || { total_days: 0, present_days: 0, absent_days: 0, leave_days: 0 };
  }

  upsertAttendance(attendanceData) {
    const { employee_id, date, check_in, check_out, status } = attendanceData;
    const existing = this.db.prepare('SELECT id FROM attendance WHERE employee_id = ? AND date = ?').get(employee_id, date);
    if (existing) {
      return this.update(existing.id, { check_in, check_out, status });
    }
    return this.db.prepare('INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)').run(employee_id, date, check_in, check_out, status);
  }

  getLeaves({ employee_id, status, branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `SELECT l.*, e.full_name AS employee_name FROM leaves l LEFT JOIN employees e ON e.id = l.employee_id WHERE 1=1`;
    const params = [];
    if (employee_id) { sql += ' AND l.employee_id = ?'; params.push(employee_id); }
    if (status) { sql += ' AND l.status = ?'; params.push(status); }
    if (branch_id) { sql += ' AND e.branch_id = ?'; params.push(branch_id); }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY l.start_date DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getPayrolls({ employee_id, month, year, branch_id = 1, page = 1, limit = 20 } = {}) {
    let sql = `SELECT p.*, e.full_name AS employee_name, je.entry_number AS journal_entry_number FROM payrolls p LEFT JOIN employees e ON e.id = p.employee_id LEFT JOIN journal_entries je ON je.id = p.journal_entry_id WHERE 1=1`;
    const params = [];
    if (employee_id) { sql += ' AND p.employee_id = ?'; params.push(employee_id); }
    if (month) { sql += ' AND p.month = ?'; params.push(month); }
    if (year) { sql += ' AND p.month LIKE ?'; params.push(`${year}-%`); }
    if (branch_id) { sql += ' AND p.branch_id = ?'; params.push(branch_id); }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY p.month DESC, p.id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  saveLeave({ id, employee_id, leave_type, start_date, end_date, status = 'pending', reason }) {
    const leave = {
      employee_id,
      leave_type,
      start_date,
      end_date,
      status,
      reason: reason || null,
    };
    return id ? this.update(id, leave) : this.create(leave);
  }

  generatePayroll({ branch_id = 1, employee_id, month, year, allowances = 0, deductions = 0 }) {
    const db = getDatabase();
    const employee = db.prepare('SELECT salary_base, full_name FROM employees WHERE id = ? AND is_active = 1').get(employee_id);
    if (!employee) throw new Error('الموظف غير موجود أو معطل');
    const existing = db.prepare('SELECT id FROM payrolls WHERE employee_id = ? AND month = ?').get(employee_id, month);
    if (existing) throw new Error('كشوف الرواتب لهذا الشهر موجودة بالفعل');

    const netSalary = Number(employee.salary_base) + Number(allowances || 0) - Number(deductions || 0);

    return db.transaction(() => {
      const payroll = db.prepare('INSERT INTO payrolls (branch_id, employee_id, month, base_salary, allowances, deductions, net_salary, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, \'draft\', CURRENT_TIMESTAMP)').run(branch_id, employee_id, month, employee.salary_base, allowances, deductions, netSalary);

      const entryNumber = generateDocumentNumber('journal_entries', 'entry_number', 'JE-');
      const description = `كشف رواتب - ${employee.full_name} - ${year}-${String(month).padStart(2, '0')}`;
      const entryId = db.prepare('INSERT INTO journal_entries (branch_id, entry_number, date, description, reference_type, reference_id, is_posted, created_by) VALUES (?, ?, date(\'now\'), ?, ?, ?, 0, ?)').run(branch_id, entryNumber, description, 'payroll', payroll.lastInsertRowid, null);

      const salaryAccount = db.prepare("SELECT id FROM chart_of_accounts WHERE account_type = 'expense' AND name LIKE '%رواتب%'").get();
      const allowancesAccount = db.prepare("SELECT id FROM chart_of_accounts WHERE account_type = 'expense' AND name LIKE '%بدلات%'").get();
      const deductionsAccount = db.prepare("SELECT id FROM chart_of_accounts WHERE account_type = 'expense' AND name LIKE '%خصومات%'").get();
      const salaryLiabilityAccount = db.prepare("SELECT id FROM chart_of_accounts WHERE account_type = 'liability' AND name LIKE '%رواتب%'").get();

      const lines = [];
      if (salaryAccount) lines.push({ account_id: salaryAccount.id, debit: employee.salary_base, credit: 0 });
      if (allowancesAccount && allowances) lines.push({ account_id: allowancesAccount.id, debit: allowances, credit: 0 });
      if (deductionsAccount && deductions) lines.push({ account_id: deductionsAccount.id, debit: deductions, credit: 0 });
      if (salaryLiabilityAccount) lines.push({ account_id: salaryLiabilityAccount.id, debit: 0, credit: netSalary });

      if (lines.length) {
        const insertLine = db.prepare('INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)');
        for (const line of lines) {
          insertLine.run(entryId.lastInsertRowid, line.account_id, line.debit, line.credit);
        }
      }

      db.prepare('UPDATE payrolls SET journal_entry_id = ?, status = \'posted\' WHERE id = ?').run(entryId.lastInsertRowid, payroll.lastInsertRowid);

      return { payroll: db.prepare('SELECT * FROM payrolls WHERE id = ?').get(payroll.lastInsertRowid), journal_entry_id: entryId.lastInsertRowid, entry_number: entryNumber };
    })();
  }
}

module.exports = new HrRepository();
