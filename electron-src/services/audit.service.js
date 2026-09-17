const auditRepository = require('../repositories/audit.repository');

class AuditService {
  searchLogs(params) {
    return auditRepository.searchLogs(params);
  }

  getModules() {
    return auditRepository.getDistinctModules();
  }
}

module.exports = new AuditService();
