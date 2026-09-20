const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');
const { resolveAccount, createJournalEntry } = require('../utils/journal');

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

  generatePayroll({ branch_id = 1, employee_id, month, year, allowances = 0, deductions = 0, currentUserId }) {
    const db = getDatabase();
    const employee = db.prepare('SELECT salary_base, full_name FROM employees WHERE id = ? AND is_active = 1').get(employee_id);
    if (!employee) throw new Error('الموظف غير موجود أو معطل');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const existing = db.prepare('SELECT id FROM payrolls WHERE employee_id = ? AND month = ?').get(employee_id, monthKey);
    if (existing) throw new Error('كشوف الرواتب لهذا الشهر موجودة بالفعل');

    const baseSalary = Number(employee.salary_base || 0);
    const totalAllowances = Number(allowances || 0);
    const totalDeductions = Number(deductions || 0);
    const netSalary = baseSalary + totalAllowances - totalDeductions;

    return db.transaction(() => {
      const payroll = db.prepare('INSERT INTO payrolls (branch_id, employee_id, month, base_salary, allowances, deductions, net_salary, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, \'draft\', CURRENT_TIMESTAMP)').run(branch_id, employee_id, monthKey, baseSalary, totalAllowances, totalDeductions, netSalary);

      // Balanced payroll entry: gross expense (debit) = deductions + net payable (credit).
      // Reuses the shared createJournalEntry helper which rejects unbalanced lines.
      const salaryAccount = resolveAccount(db, '6110', 'expense', 'رواتب');
      const allowancesAccount = resolveAccount(db, '6120', 'expense', 'بدلات');
      const salaryLiabilityAccount = resolveAccount(db, '2400', 'liability', 'رواتب');
      let deductionsAccount = resolveAccount(db, null, 'liability', 'خصومات');
      if (!deductionsAccount) deductionsAccount = resolveAccount(db, '2500', 'liability', 'مستحقات أخرى');

      const journalLines = [];
      if (salaryAccount) journalLines.push({ account_id: salaryAccount, debit: baseSalary, credit: 0 });
      if (allowancesAccount && totalAllowances) journalLines.push({ account_id: allowancesAccount, debit: totalAllowances, credit: 0 });
      if (deductionsAccount && totalDeductions) journalLines.push({ account_id: deductionsAccount, debit: 0, credit: totalDeductions });
      if (salaryLiabilityAccount) journalLines.push({ account_id: salaryLiabilityAccount, debit: 0, credit: netSalary });

      const journal = createJournalEntry(db, {
        branch_id,
        description: `كشف رواتب - ${employee.full_name} - ${monthKey}`,
        reference_type: 'payroll',
        reference_id: payroll.lastInsertRowid,
        lines: journalLines,
        created_by: currentUserId || null,
      });

      if (journal) {
        db.prepare('UPDATE payrolls SET journal_entry_id = ?, status = \'posted\' WHERE id = ?').run(journal.id, payroll.lastInsertRowid);
      }

      return { payroll: db.prepare('SELECT * FROM payrolls WHERE id = ?').get(payroll.lastInsertRowid), journal_entry_id: journal ? journal.id : null, entry_number: journal ? journal.entry_number : null };
    })();
  }
}

module.exports = new HrRepository();
