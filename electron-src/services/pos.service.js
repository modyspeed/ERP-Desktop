const posRepository = require('../repositories/pos.repository');
const auditRepository = require('../repositories/audit.repository');

class PosService {
  getActiveSession({ cashier_id, branch_id }) {
    if (!cashier_id) throw new Error('معرّف الكاشير مطلوب');
    return posRepository.getOpenSession(cashier_id, branch_id || 1);
  }

  openSession(data, currentUserId) {
    const session = posRepository.openSession({
      cashier_id: data.cashier_id,
      branch_id: data.branch_id || 1,
      opening_balance: data.opening_balance,
    });

    auditRepository.log({
      userId: currentUserId || data.cashier_id,
      module: 'pos',
      action: 'open_session',
      recordId: session.id,
      oldValue: null,
      newValue: session,
    });

    return session;
  }

  closeSession({ id, closing_balance }, currentUserId) {
    const existing = posRepository.getSessionById(id);
    if (!existing) throw new Error('الوردية غير موجودة');
    if (existing.status === 'closed') throw new Error('الوردية مغلقة بالفعل');

    const cashSales = posRepository.getCashSalesTotal(id);
    const expectedBalance = Number(existing.opening_balance || 0) + cashSales;
    const difference = Number(closing_balance || 0) - expectedBalance;

    const closed = posRepository.closeSession(id, {
      closing_balance,
      expected_balance: expectedBalance,
      difference,
    });

    auditRepository.log({
      userId: currentUserId || existing.cashier_id,
      module: 'pos',
      action: 'close_session',
      recordId: id,
      oldValue: existing,
      newValue: closed,
    });

    return closed;
  }

  recordTransaction(data) {
    return posRepository.recordTransaction(data);
  }

  getSessionStats(sessionId) {
    const session = posRepository.getSessionById(sessionId);
    if (!session) throw new Error('الوردية غير موجودة');
    return {
      ...session,
      cash_sales: posRepository.getCashSalesTotal(sessionId),
      transactions_count: posRepository.countSessionTransactions(sessionId),
      expected_balance: Number(session.opening_balance || 0) + posRepository.getCashSalesTotal(sessionId),
    };
  }
}

module.exports = new PosService();
