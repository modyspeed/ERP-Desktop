const returnRepository = require('../repositories/return.repository');
const auditRepository = require('../repositories/audit.repository');

class ReturnService {
  searchSalesReturns(params) { return returnRepository.searchSalesReturns(params || {}); }

  getSalesReturn(id) { return returnRepository.getSalesReturn(id); }

  createSalesReturn(data) {
    if (!data.invoice_id) throw new Error('Invoice is required');
    if (!data.items || !data.items.length) throw new Error('At least one item is required');

    const result = returnRepository.createSalesReturn(data);

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'returns',
      action: 'create_sales_return',
      recordId: result.id,
      oldValue: null,
      newValue: { id: result.id, return_number: result.return_number, total_amount: result.total_amount },
    });

    return result;
  }

  searchPurchaseReturns(params) { return returnRepository.searchPurchaseReturns(params || {}); }

  getPurchaseReturn(id) { return returnRepository.getPurchaseReturn(id); }

  createPurchaseReturn(data) {
    if (!data.invoice_id) throw new Error('Invoice is required');
    if (!data.items || !data.items.length) throw new Error('At least one item is required');

    const result = returnRepository.createPurchaseReturn(data);

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'returns',
      action: 'create_purchase_return',
      recordId: result.id,
      oldValue: null,
      newValue: { id: result.id, return_number: result.return_number, total_amount: result.total_amount },
    });

    return result;
  }
}

module.exports = new ReturnService();