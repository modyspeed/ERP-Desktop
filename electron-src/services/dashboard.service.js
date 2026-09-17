const dashboardRepository = require('../repositories/dashboard.repository');

class DashboardService {
  getSummary(branchId) {
    return dashboardRepository.getMetrics(branchId);
  }

  getCharts() {
    return {
      monthly: dashboardRepository.getMonthlyChartData(),
      categoryDistribution: dashboardRepository.getCategorySalesDistribution(),
    };
  }

  getAlerts() {
    return dashboardRepository.getAlerts();
  }

  getRecentActivities(limit = 10) {
    return dashboardRepository.getRecentActivities(limit);
  }
}

module.exports = new DashboardService();
