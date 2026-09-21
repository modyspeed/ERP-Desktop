const tableRepository = require('../repositories/table.repository');
const auditRepository = require('../repositories/audit.repository');

class TableService {
  listTables(branchId) {
    return tableRepository.listTables(branchId || 1);
  }

  saveTable(data, currentUserId) {
    const existing = data?.id ? tableRepository.findById(data.id) : null;
    const saved = tableRepository.saveTable(data);

    auditRepository.log({
      userId: currentUserId,
      module: 'tables',
      action: data.id ? 'update' : 'create',
      recordId: saved.id,
      oldValue: existing,
      newValue: saved,
    });

    return saved;
  }

  updateTableStatus({ id, status, currentUserId }) {
    const existing = tableRepository.findById(id);
    if (!existing) throw new Error('الطاولة غير موجودة');

    const updated = tableRepository.updateStatus(id, status);

    auditRepository.log({
      userId: currentUserId,
      module: 'tables',
      action: 'update_status',
      recordId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  deleteTable(id, currentUserId) {
    const existing = tableRepository.findById(id);
    if (!existing) throw new Error('الطاولة غير موجودة');

    tableRepository.softDelete(id);

    auditRepository.log({
      userId: currentUserId,
      module: 'tables',
      action: 'delete',
      recordId: id,
      oldValue: existing,
      newValue: null,
    });

    return true;
  }
}

module.exports = new TableService();
