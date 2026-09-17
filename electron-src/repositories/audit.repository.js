const { getDatabase } = require('../database/db');

class AuditRepository {
  get db() {
    return getDatabase();
  }

  log({ userId, module, action, recordId, oldValue, newValue, ip = '127.0.0.1' }) {
    const sql = `
      INSERT INTO audit_logs (user_id, module, action, record_id, old_value, new_value, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const oldValStr = oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null;
    const newValStr = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;

    return this.db.prepare(sql).run(userId, module, action, recordId, oldValStr, newValStr, ip);
  }

  searchLogs({ query, module, action, userId, startDate, endDate, page = 1, limit = 20 }) {
    let sql = `
      SELECT a.*, u.full_name as user_name, u.username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ` AND (u.full_name LIKE ? OR u.username LIKE ? OR a.module LIKE ? OR a.action LIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q, q);
    }

    if (module) {
      sql += ` AND a.module = ?`;
      params.push(module);
    }

    if (action) {
      sql += ` AND a.action = ?`;
      params.push(action);
    }

    if (userId) {
      sql += ` AND a.user_id = ?`;
      params.push(userId);
    }

    if (startDate) {
      sql += ` AND a.created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND a.created_at <= ?`;
      params.push(endDate);
    }

    // Total count
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countRow = this.db.prepare(countSql).get(...params);
    const total = countRow ? countRow.total : 0;

    // Pagination
    sql += ` ORDER BY a.id DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const items = this.db.prepare(sql).all(...params);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  getDistinctModules() {
    return this.db.prepare('SELECT DISTINCT module FROM audit_logs ORDER BY module ASC').all().map(r => r.module);
  }
}

module.exports = new AuditRepository();
