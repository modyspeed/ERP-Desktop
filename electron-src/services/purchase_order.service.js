const purchaseOrderRepository = require('../repositories/purchase_order.repository');
const auditRepository = require('../repositories/audit.repository');

class PurchaseOrderService {
  searchPurchaseOrders(params) { return purchaseOrderRepository.searchPurchaseOrders(params || {}); }
  getFormOptions(branchId) { return purchaseOrderRepository.getFormOptions(branchId || 1); }
  getPurchaseOrder(id) { return purchaseOrderRepository.getPurchaseOrder(id); }

  savePurchaseOrder(data) {
    if (!data.supplier_id) throw new Error('المورد مطلوب');
    if (!data.items || !data.items.length) throw new Error('يجب إضافة صنف واحد على الأقل');

    const existing = data.id ? purchaseOrderRepository.findById(data.id) : null;
    const result = purchaseOrderRepository.savePurchaseOrder({
      ...data,
      currentUserId: data.currentUserId || null,
    });

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'purchases',
      action: data.id ? 'update' : 'create',
      recordId: result.id,
      oldValue: existing ? { supplier_id: existing.supplier_id, total_amount: existing.total_amount } : null,
      newValue: { id: result.id, po_number: result.po_number, total_amount: result.total_amount },
    });

    return result;
  }

  convertToInvoice(poId, data) {
    const result = purchaseOrderRepository.convertToInvoice(poId, data || {});

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'purchases',
      action: 'convert_to_invoice',
      recordId: poId,
      oldValue: { status: 'pending' },
      newValue: { status: 'invoiced', invoice_id: result.invoice?.id },
    });

    return result;
  }
}

module.exports = new PurchaseOrderService();