const tableService = require('../services/table.service');

function registerTablesIPC(ipcMain) {
  ipcMain.handle('tables:list', async (event, params) => {
    const branchId = typeof params === 'object' && params !== null ? params.branch_id ?? params.branchId : params;
    try {
      return { success: true, data: tableService.listTables(branchId) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('tables:save', async (event, data) => {
    const { _userId, currentUserId, ...tableData } = data || {};
    try {
      return {
        success: true,
        data: tableService.saveTable(tableData, _userId || currentUserId),
        message: 'تم حفظ الطاولة بنجاح',
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('tables:update-status', async (event, params) => {
    const { _userId, currentUserId, id, status } = params || {};
    try {
      return {
        success: true,
        data: tableService.updateTableStatus({ id, status, currentUserId: _userId || currentUserId }),
        message: 'تم تحديث حالة الطاولة',
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('tables:delete', async (event, params) => {
    const { _userId, currentUserId, id } = typeof params === 'object' && params !== null ? params : { id: params };
    try {
      tableService.deleteTable(id, _userId || currentUserId);
      return { success: true, message: 'تم حذف الطاولة بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerTablesIPC;
