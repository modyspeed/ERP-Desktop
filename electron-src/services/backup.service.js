const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { getDatabase, getDbPath } = require('../database/db');
const auditRepository = require('../repositories/audit.repository');

class BackupService {
  getBackupDir() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'backups');
  }

  listBackups() {
    const backupDir = this.getBackupDir();
    if (!fs.existsSync(backupDir)) return [];
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.db'));
    return files.map((file) => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      return { file_name: file, file_path: filePath, size: stats.size, created_at: stats.mtime.toISOString() };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  backup(currentUserId) {
    const backupDir = this.getBackupDir();
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const dbPath = getDbPath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
    const backupFileName = `backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    if (!fs.existsSync(dbPath)) throw new Error('قاعدة البيانات غير موجودة');

    const sourceDb = getDatabase();
    const backupDb = new (require('better-sqlite3'))(backupPath);
    sourceDb.backup(backupDb);
    backupDb.close();

    auditRepository.log({
      userId: currentUserId || null,
      module: 'backup',
      action: 'create',
      recordId: null,
      oldValue: null,
      newValue: { file_name: backupFileName, size: fs.statSync(backupPath).size },
    });

    return { file_name: backupFileName, file_path: backupPath, size: fs.statSync(backupPath).size, created_at: new Date().toISOString() };
  }

  restore(backupPath, currentUserId) {
    if (!fs.existsSync(backupPath)) throw new Error('ملف النسخ الاحتياطي غير موجود');

    const dbPath = getDbPath();
    const backupDb = new (require('better-sqlite3'))(backupPath);
    const targetDb = getDatabase();

    targetDb.pragma('wal_checkpoint(TRUNCATE)');
    backupDb.backup(targetDb);
    backupDb.close();

    auditRepository.log({
      userId: currentUserId || null,
      module: 'backup',
      action: 'restore',
      recordId: null,
      oldValue: null,
      newValue: { backup_path: backupPath, restored_at: new Date().toISOString() },
    });

    return { success: true, restored_at: new Date().toISOString() };
  }

  deleteBackup(backupPath, currentUserId) {
    if (!fs.existsSync(backupPath)) throw new Error('ملف النسخ الاحتياطي غير موجود');
    fs.unlinkSync(backupPath);

    auditRepository.log({
      userId: currentUserId || null,
      module: 'backup',
      action: 'delete',
      recordId: null,
      oldValue: { file_path: backupPath },
      newValue: { deleted: true },
    });

    return { success: true };
  }

  getBackupSize(backupPath) {
    if (!fs.existsSync(backupPath)) return 0;
    return fs.statSync(backupPath).size;
  }
}

module.exports = new BackupService();