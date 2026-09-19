const returnRepository = require('../repositories/return.repository');
const auditRepository = require('../repositories/audit.repository');

class ReturnService {
  searchSalesReturns(params) { return returnRepository.searchSalesReturns(params || {}); }

  getSalesReturn(id) { return returnRepository.getSalesReturn(id); }

  createSalesReturn(data) {
    if (!data.invoice_id) throw new Error('الفاتورة مطلوبة');
    if (!data.items || !data.items.length) throw new Error('يجب إضافة صنف واحد على الأقل');

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
    if (!data.invoice_id) throw new Error('الفاتورة مطلوبة');
    if (!data.items || !data.items.length) throw new Error('يجب إضافة صنف واحد على الأقل');

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