const taxService = require('../services/tax.service');

function registerTaxesIPC(ipcMain) {
  ipcMain.handle('taxes:list', async (event, params) => {
    try { return { success: true, data: taxService.listRules(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('taxes:update', async (event, { id, ...data }) => {
    try { return { success: true, data: taxService.updateRule(id, data), message: 'تم تحديث إعداد الضريبة' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerTaxesIPC;