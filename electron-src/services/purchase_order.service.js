const purchaseOrderRepository = require('../repositories/purchase_order.repository');

class PurchaseOrderService {
  searchPurchaseOrders(params) { return purchaseOrderRepository.searchPurchaseOrders(params || {}); }
  getFormOptions(branchId) { return purchaseOrderRepository.getFormOptions(branchId || 1); }
  getPurchaseOrder(id) { return purchaseOrderRepository.getPurchaseOrder(id); }
  savePurchaseOrder(data) {
    if (!data.supplier_id) throw new Error('المورد مطلوب');
    return purchaseOrderRepository.savePurchaseOrder(data);
  }
  convertToInvoice(poId, data) { return purchaseOrderRepository.convertToInvoice(poId, data || {}); }
}

module.exports = new PurchaseOrderService();
