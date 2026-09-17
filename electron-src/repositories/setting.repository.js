const { getDatabase } = require('../database/db');

class SettingRepository {
  get db() {
    return getDatabase();
  }

  getSettings() {
    let settings = this.db.prepare('SELECT * FROM company_settings LIMIT 1').get();
    if (!settings) {
      this.db.prepare(`
        INSERT INTO company_settings (company_name) VALUES ('مؤسستي التجارية')
      `).run();
      settings = this.db.prepare('SELECT * FROM company_settings LIMIT 1').get();
    }
    return settings;
  }

  updateSettings(data) {
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
    if (keys.length === 0) return this.getSettings();

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = [...keys.map(k => data[k]), new Date().toISOString()];

    this.db.prepare(`
      UPDATE company_settings SET ${setClause}, updated_at = ? WHERE id = (SELECT id FROM company_settings LIMIT 1)
    `).run(...values);

    return this.getSettings();
  }
}

module.exports = new SettingRepository();
