const reportRepository = require('../repositories/report.repository');

class ReportService {
  profitLoss(params) { return reportRepository.profitLoss(params || {}); }
  inventoryMovement(params) { return reportRepository.inventoryMovement(params || {}); }
  taxReport(params) { return reportRepository.taxReport(params || {}); }
  salesSummary(params) { return reportRepository.salesSummary(params || {}); }
  trialBalance(params) { return reportRepository.trialBalance(params || {}); }
  incomeStatement(params) { return reportRepository.incomeStatement(params || {}); }
  balanceSheet(params) { return reportRepository.balanceSheet(params || {}); }
}

module.exports = new ReportService();
