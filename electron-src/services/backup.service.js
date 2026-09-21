const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { getDatabase, getDbPath, closeDatabase } = require('../database/db');
const auditRepository = require('../repositories/audit.repository');

class BackupService {
  getBackupDir() {
    // Allow tests / advanced tooling to redirect the backup folder.
    const override = process.env.ERP_BACKUP_DIR;
    if (override) return override;
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

  async backup(currentUserId) {
    const backupDir = this.getBackupDir();
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const dbPath = getDbPath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
    const backupFileName = `backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    if (!fs.existsSync(dbPath)) throw new Error('Database file not found');

    // better-sqlite3's backup() is async and resolves once the copy is fully
    // flushed to disk. It copies the source database into the destination path
    // (creating/overwriting it) and handles the live WAL automatically.
    const sourceDb = getDatabase();
    await sourceDb.backup(backupPath);

    if (!fs.existsSync(backupPath) || fs.statSync(backupPath).size === 0) {
      throw new Error('Backup file was not written');
    }

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

  async restore(backupPath, currentUserId) {
    if (!fs.existsSync(backupPath)) throw new Error('Backup file not found');

    const dbPath = getDbPath();

    // Validate the backup before touching the live database, so a corrupt or
    // truncated file can never destroy the working database.
    const Database = require('better-sqlite3');
    const probe = new Database(backupPath, { readonly: true });
    const integrity = probe.prepare('PRAGMA quick_check').get();
    probe.close();
    if (!integrity || integrity.quick_check !== 'ok') {
      throw new Error(`Backup file is corrupt or not a valid database: ${integrity && integrity.quick_check}`);
    }

    // The live connection must be released before replacing the file,
    // otherwise the open handle and the WAL/SHM side files keep the
    // post-backup data alive and the restore silently does nothing.
    closeDatabase();

    for (const suffix of ['-wal', '-shm', '-journal']) {
      const sideFile = dbPath + suffix;
      if (fs.existsSync(sideFile)) {
        try { fs.unlinkSync(sideFile); } catch { /* best effort */ }
      }
    }

    // Byte-level replacement now that no connection holds the file.
    fs.copyFileSync(backupPath, dbPath);

    // Re-open so every subsequent query sees the restored data.
    getDatabase();

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
    if (!fs.existsSync(backupPath)) throw new Error('Backup file not found');
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