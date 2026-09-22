const { getDatabase } = require('../database/db');

class PosRepository {
  get db() {
    return getDatabase();
  }

  getOpenSession(cashierId, branchId) {
    if (!cashierId) return null;
    return this.db
      .prepare(
        `SELECT * FROM pos_sessions WHERE cashier_id = ? AND branch_id = ? AND status = 'open' ORDER BY opened_at DESC LIMIT 1`
      )
      .get(cashierId, branchId);
  }

  getSessionById(id) {
    if (!id) return null;
    return this.db.prepare('SELECT * FROM pos_sessions WHERE id = ?').get(id);
  }

  openSession({ cashier_id, branch_id = 1, opening_balance = 0 }) {
    if (!cashier_id) throw new Error('معرّف الكاشير مطلوب لفتح الوردية');

    const db = getDatabase();
    const existing = this.getOpenSession(cashier_id, branch_id);
    if (existing) throw new Error('يوجد وردية مفتوحة بالفعل لهذا الكاشير، يجب إغلاقها أولاً');

    const info = db
      .prepare(
        `INSERT INTO pos_sessions (branch_id, cashier_id, opening_balance, opened_at, status) VALUES (?, ?, ?, ?, 'open')`
      )
      .run(branch_id, cashier_id, Number(opening_balance) || 0, new Date().toISOString());

    return this.getSessionById(info.lastInsertRowid);
  }

  closeSession(id, { closing_balance, expected_balance, difference }) {
    if (!id) throw new Error('معرّف الوردية مطلوب');

    const db = getDatabase();
    const existing = this.getSessionById(id);
    if (!existing) throw new Error('الوردية غير موجودة');
    if (existing.status === 'closed') throw new Error('الوردية مغلقة بالفعل');

    db.prepare(
      `UPDATE pos_sessions SET closing_balance = ?, expected_balance = ?, difference = ?, closed_at = ?, status = 'closed' WHERE id = ?`
    ).run(Number(closing_balance) || 0, Number(expected_balance) || 0, Number(difference) || 0, new Date().toISOString(), id);

    return this.getSessionById(id);
  }

  recordTransaction({ session_id, invoice_id, payment_method = 'cash', amount_paid = 0, change_due = 0 }) {
    if (!session_id || !invoice_id) throw new Error('الوردية والفاتورة مطلوبتان لتسجيل المعاملة');

    const db = getDatabase();
    const info = db
      .prepare(
        `INSERT INTO pos_transactions (session_id, invoice_id, payment_method, amount_paid, change_due, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(session_id, invoice_id, payment_method, Number(amount_paid) || 0, Number(change_due) || 0, new Date().toISOString());

    return db.prepare('SELECT * FROM pos_transactions WHERE id = ?').get(info.lastInsertRowid);
  }

  // إجمالي المبيعات الكاش لوردية معينة (المبلغ المدفوع الفعلي بعد الباقي)
  getCashSalesTotal(sessionId) {
    if (!sessionId) return 0;
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(amount_paid - change_due), 0) AS total FROM pos_transactions WHERE session_id = ? AND payment_method = 'cash'`
      )
      .get(sessionId);
    return Number(row?.total || 0);
  }

  countSessionTransactions(sessionId) {
    if (!sessionId) return 0;
    const row = this.db
      .prepare('SELECT COUNT(*) AS total FROM pos_transactions WHERE session_id = ?')
      .get(sessionId);
    return Number(row?.total || 0);
  }
}

module.exports = new PosRepository();
