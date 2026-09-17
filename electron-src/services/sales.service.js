const salesRepository = require('../repositories/sales.repository');

class SalesService {
  listInvoices(params) { return salesRepository.listInvoices(params); }
  getFormOptions(branchId) { return salesRepository.getFormOptions(branchId); }
  createInvoice(data) { return salesRepository.createInvoice(data); }
}

module.exports = new SalesService();