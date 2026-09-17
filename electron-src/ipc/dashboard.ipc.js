const dashboardService = require('../services/dashboard.service');

function registerDashboardIPC(ipcMain) {
  ipcMain.handle('dashboard:get-metrics', async (event, branchId) => {
    try {
      const data = dashboardService.getSummary(branchId);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('dashboard:get-charts', async () => {
    try {
      const data = dashboardService.getCharts();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('dashboard:get-alerts', async () => {
    try {
      const data = dashboardService.getAlerts();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('dashboard:get-activities', async (event, limit) => {
    try {
      const data = dashboardService.getRecentActivities(limit);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerDashboardIPC;
