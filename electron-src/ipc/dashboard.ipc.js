const dashboardService = require('../services/dashboard.service');

function registerDashboardIPC(ipcMain) {
  ipcMain.handle('dashboard:get-metrics', async (event, branchId) => {
    const id = typeof branchId === 'object' && branchId !== null ? branchId.id : branchId;
    try {
      const data = dashboardService.getSummary(id);
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
    const value = typeof limit === 'object' && limit !== null ? limit.id : limit;
    try {
      const data = dashboardService.getRecentActivities(value);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerDashboardIPC;
