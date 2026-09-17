const purchaseRepository = require('../repositories/purchase.repository');

class PurchaseService {
  listInvoices(params) { return purchaseRepository.listInvoices(params); }
  getFormOptions(branchId) { return purchaseRepository.getFormOptions(branchId); }
  createInvoice(data) { return purchaseRepository.createInvoice(data); }
}

module.exports = new PurchaseService();