const { getDatabase } = require('../database/db');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  get db() {
    return getDatabase();
  }

  findById(id) {
    return this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE id = ? AND is_deleted = 0`)
      .get(id);
  }

  findAll(filters = {}, options = {}) {
    let sql = `SELECT * FROM ${this.tableName} WHERE is_deleted = 0`;
    const params = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        sql += ` AND ${key} = ?`;
        params.push(value);
      }
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    } else {
      sql += ` ORDER BY id DESC`;
    }

    if (options.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);

      if (options.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
      }
    }

    return this.db.prepare(sql).all(...params);
  }

  count(filters = {}) {
    let sql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE is_deleted = 0`;
    const params = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        sql += ` AND ${key} = ?`;
        params.push(value);
      }
    }

    const row = this.db.prepare(sql).get(...params);
    return row ? row.total : 0;
  }

  create(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    const result = this.db.prepare(sql).run(...values);
    return this.findById(result.lastInsertRowid);
  }

  update(id, data) {
    const keys = Object.keys(data);
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...Object.values(data), new Date().toISOString(), id];

    const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = ? WHERE id = ? AND is_deleted = 0`;
    this.db.prepare(sql).run(...values);
    return this.findById(id);
  }

  softDelete(id) {
    const sql = `UPDATE ${this.tableName} SET is_deleted = 1, updated_at = ? WHERE id = ?`;
    return this.db.prepare(sql).run(new Date().toISOString(), id);
  }
}

module.exports = BaseRepository;
