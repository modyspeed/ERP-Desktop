const registerAuthIPC = require('./auth.ipc');
const registerUsersIPC = require('./users.ipc');
const registerSettingsIPC = require('./settings.ipc');
const registerAuditIPC = require('./audit.ipc');
const registerDashboardIPC = require('./dashboard.ipc');
const registerProductsIPC = require('./products.ipc');
const registerCustomersIPC = require('./customers.ipc');
const registerSalesIPC = require('./sales.ipc');
const registerSuppliersIPC = require('./suppliers.ipc');
const registerPurchasesIPC = require('./purchases.ipc');
const registerAccountsIPC = require('./accounts.ipc');
const registerCategoriesIPC = require('./categories.ipc');
const registerHrIPC = require('./hr.ipc');
const registerTaxesIPC = require('./taxes.ipc');
const printerAdapter = require('../hardware/printer.adapter');
const cashDrawerAdapter = require('../hardware/cashdrawer.adapter');

function registerAllIPC(ipcMain) {
  registerAuthIPC(ipcMain);
  registerUsersIPC(ipcMain);
  registerSettingsIPC(ipcMain);
  registerAuditIPC(ipcMain);
  registerDashboardIPC(ipcMain);
  registerProductsIPC(ipcMain);
  registerCustomersIPC(ipcMain);
  registerSalesIPC(ipcMain);
  registerSuppliersIPC(ipcMain);
  registerPurchasesIPC(ipcMain);
  registerAccountsIPC(ipcMain);
  registerCategoriesIPC(ipcMain);
  registerTaxesIPC(ipcMain);
  registerHrIPC(ipcMain);

  // Hardware IPC
  ipcMain.handle('hardware:print-receipt', async (event, params) => {
    try {
      const result = await printerAdapter.printReceipt(params);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('hardware:open-cashdrawer', async () => {
    try {
      const result = await cashDrawerAdapter.openDrawer();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { registerAllIPC };
