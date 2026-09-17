const accountService = require('../services/account.service');

function registerAccountsIPC(ipcMain) {
  ipcMain.handle('accounts:list', async (event, params) => {
    try { return { success: true, data: accountService.listAccounts(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:save', async (event, data) => {
    try { return { success: true, data: accountService.saveAccount(data), message: 'تم حفظ الحساب بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:delete', async (event, id) => {
    try { accountService.deleteAccount(id); return { success: true, message: 'تم حذف الحساب بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:catalogs', async () => {
    try { return { success: true, data: accountService.listCatalogs() }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:create-catalog', async (event, data) => {
    try { accountService.createCatalog(data); return { success: true, message: 'تم إنشاء الدليل المخصص بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:apply-catalog', async (event, id) => {
    try { return { success: true, data: accountService.applyCatalog(id), message: 'تم تطبيق الدليل المحاسبي بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerAccountsIPC;