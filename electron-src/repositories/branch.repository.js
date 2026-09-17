const BaseRepository = require('./base.repository');

class BranchRepository extends BaseRepository {
  constructor() {
    super('branches');
  }

  getMainBranch() {
    return this.db.prepare('SELECT * FROM branches WHERE is_main_branch = 1 AND is_deleted = 0 LIMIT 1').get();
  }

  setMainBranch(branchId) {
    return this.db.transaction(() => {
      this.db.prepare('UPDATE branches SET is_main_branch = 0 WHERE is_deleted = 0').run();
      this.db.prepare('UPDATE branches SET is_main_branch = 1 WHERE id = ?').run(branchId);
    })();
  }
}

module.exports = new BranchRepository();
