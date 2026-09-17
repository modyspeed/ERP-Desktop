const { getDatabase } = require('../database/db');

class PermissionRepository {
  get db() {
    return getDatabase();
  }

  getAll() {
    return this.db.prepare('SELECT * FROM permissions ORDER BY module ASC, id ASC').all();
  }

  getGroupedByModule() {
    const all = this.getAll();
    const grouped = {};
    for (const perm of all) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }
    return grouped;
  }
}

module.exports = new PermissionRepository();
