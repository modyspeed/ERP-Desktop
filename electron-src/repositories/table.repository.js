const BaseRepository = require('./base.repository');

const ALLOWED_STATUSES = ['available', 'occupied', 'reserved'];

class TableRepository extends BaseRepository {
  constructor() {
    super('tables');
  }

  isValidStatus(status) {
    return ALLOWED_STATUSES.includes(status);
  }

  listTables(branchId) {
    return this.db
      .prepare(
        'SELECT * FROM tables WHERE branch_id = ? AND is_deleted = 0 ORDER BY CAST(table_number AS INTEGER) ASC, table_number ASC'
      )
      .all(branchId);
  }

  saveTable({ id, branch_id = 1, table_number, seats_count = 2, status = 'available', created_by = null }) {
    if (!table_number || !String(table_number).trim()) throw new Error('رقم الطاولة مطلوب');
    if (!this.isValidStatus(status)) throw new Error('حالة الطاولة غير صحيحة');
    if (Number(seats_count) < 0) throw new Error('عدد المقاعد غير صحيح');

    const branchId = branch_id || 1;
    const number = String(table_number).trim();

    const duplicate = this.db
      .prepare('SELECT id FROM tables WHERE branch_id = ? AND table_number = ? AND is_deleted = 0 AND id != ?')
      .get(branchId, number, id || 0);
    if (duplicate) throw new Error(`الطاولة رقم ${number} مسجلة مسبقاً في هذا الفرع`);

    const data = {
      branch_id: branchId,
      table_number: number,
      seats_count: Number(seats_count) || 0,
      status,
      created_by,
    };

    return id ? this.update(id, data) : this.create(data);
  }

  updateStatus(id, status) {
    if (!id) throw new Error('معرّف الطاولة مطلوب');
    if (!this.isValidStatus(status)) throw new Error('حالة الطاولة غير صحيحة');

    this.db
      .prepare('UPDATE tables SET status = ?, updated_at = ? WHERE id = ? AND is_deleted = 0')
      .run(status, new Date().toISOString(), id);

    return this.findById(id);
  }
}

module.exports = new TableRepository();
