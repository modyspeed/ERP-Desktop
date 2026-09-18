const reportService = require('../services/report.service');

function registerReportIpc(ipcMain) {
  ipcMain.handle('reports:profit-loss', async (event, params) => {
    try { return { success: true, data: reportService.profitLoss(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('reports:inventory-movement', async (event, params) => {
    try { return { success: true, data: reportService.inventoryMovement(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('reports:tax-report', async (event, params) => {
    try { return { success: true, data: reportService.taxReport(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('reports:sales-summary', async (event, params) => {
    try { return { success: true, data: reportService.salesSummary(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerReportIpc;
