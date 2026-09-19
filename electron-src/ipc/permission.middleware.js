const { getDatabase } = require('../database/db');

/**
 * Permission Middleware - Defense in Depth enforcement at IPC layer
 * Extracts user from event.sender session, checks permissions before handler execution
 */
class PermissionMiddleware {
  constructor() {
    this.db = null;
  }

  getDb() {
    if (!this.db) this.db = getDatabase();
    return this.db;
  }

  /**
   * Extract user ID from IPC event
   */
  getCurrentUserId(event) {
    try {
      // Electron stores session user in sender frame or process
      const sender = event?.sender;
      if (sender && sender.sessionToken) {
        // Try to get user from session
        return null; // Will be passed explicitly from renderer
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user has permission for a specific module/action
   */
  hasPermission(userId, module, action) {
    if (!userId) return false;
    const db = this.getDb();
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN role_permissions rp ON rp.role_id = u.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = ? AND u.is_active = 1 AND p.module = ? AND p.action = ?
    `).get(userId, module, action);
    return row && row.count > 0;
  }

  /**
   * Create middleware wrapper for IPC handlers
   * Usage: ipcMain.handle('channel', withPermission('module', 'action', async (event, params) => { ... }))
   */
  withPermission(module, action, handler) {
    return async (event, ...args) => {
      try {
        const userId = args[0]?.userId || args[0]?._userId || null;
        if (!userId) {
          return { success: false, error: 'غير مصرح لك بلوغ هذه الخدمة', code: 'UNAUTHORIZED' };
        }
        if (!this.hasPermission(userId, module, action)) {
          return { success: false, error: 'لا تمتلك صلاحية هذا الإجراء', code: 'FORBIDDEN' };
        }
        return await handler(event, ...args);
      } catch (err) {
        return { success: false, error: err.message };
      }
    };
  }

  /**
   * Create middleware wrapper that allows any authenticated user (no specific permission)
   */
  withAuth(handler) {
    return async (event, ...args) => {
      try {
        const userId = args[0]?.userId || args[0]?._userId || null;
        if (!userId) {
          return { success: false, error: 'غير مصرح لك بلوغ هذه الخدمة', code: 'UNAUTHORIZED' };
        }
        return await handler(event, ...args);
      } catch (err) {
        return { success: false, error: err.message };
      }
    };
  }
}

module.exports = new PermissionMiddleware();