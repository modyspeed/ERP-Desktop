const returnRepository = require('../repositories/return.repository');

class ReturnService {
  searchSalesReturns(params) { return returnRepository.searchSalesReturns(params || {}); }
  getSalesReturn(id) { return returnRepository.getSalesReturn(id); }
  createSalesReturn(data) { return returnRepository.createSalesReturn(data); }
  searchPurchaseReturns(params) { return returnRepository.searchPurchaseReturns(params || {}); }
  getPurchaseReturn(id) { return returnRepository.getPurchaseReturn(id); }
  createPurchaseReturn(data) { return returnRepository.createPurchaseReturn(data); }
}

module.exports = new ReturnService();
