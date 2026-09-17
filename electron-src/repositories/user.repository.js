const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  findByUsername(username) {
    const sql = `
      SELECT u.*, r.name as role_name, b.name as branch_name 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.username = ? AND u.is_deleted = 0
    `;
    return this.db.prepare(sql).get(username);
  }

  getUserWithPermissions(userId) {
    const user = this.db.prepare(`
      SELECT u.id, u.branch_id, u.full_name, u.username, u.email, u.phone, u.avatar, 
             u.role_id, u.is_active, u.created_at,
             r.name as role_name, b.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = ? AND u.is_deleted = 0
    `).get(userId);

    if (!user) return null;

    const permissions = this.db.prepare(`
      SELECT p.module, p.action 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `).all(user.role_id);

    user.permissions = permissions;
    return user;
  }

  searchUsers({ query, role_id, is_active, page = 1, limit = 20 }) {
    let sql = `
      SELECT u.id, u.branch_id, u.full_name, u.username, u.email, u.phone, 
             u.role_id, u.is_active, u.created_at, u.updated_at,
             r.name as role_name, b.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.is_deleted = 0
    `;
    const params = [];

    if (query) {
      sql += ` AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const q = `%${query}%`;
      params.push(q, q, q, q);
    }

    if (role_id) {
      sql += ` AND u.role_id = ?`;
      params.push(role_id);
    }

    if (is_active !== undefined && is_active !== null && is_active !== '') {
      sql += ` AND u.is_active = ?`;
      params.push(Number(is_active));
    }

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countRow = this.db.prepare(countSql).get(...params);
    const total = countRow ? countRow.total : 0;

    // Pagination
    sql += ` ORDER BY u.id DESC LIMIT ? OFFSET ?`;
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
}

module.exports = new UserRepository();
