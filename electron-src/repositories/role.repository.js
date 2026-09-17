const BaseRepository = require('./base.repository');

class RoleRepository extends BaseRepository {
  constructor() {
    super('roles');
  }

  findAllWithPermissions() {
    const roles = this.db.prepare(`
      SELECT r.*, COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id AND u.is_deleted = 0
      WHERE r.is_deleted = 0
      GROUP BY r.id
      ORDER BY r.id ASC
    `).all();

    for (const role of roles) {
      const perms = this.db.prepare(`
        SELECT p.id, p.module, p.action, p.description
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `).all(role.id);
      role.permissions = perms;
      role.permissionIds = perms.map((p) => p.id);
    }

    return roles;
  }

  saveRolePermissions(roleId, permissionIds) {
    return this.db.transaction(() => {
      // Clear existing
      this.db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);

      // Insert new
      if (permissionIds && permissionIds.length > 0) {
        const insertStmt = this.db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
        for (const pId of permissionIds) {
          insertStmt.run(roleId, pId);
        }
      }
    })();
  }
}

module.exports = new RoleRepository();
