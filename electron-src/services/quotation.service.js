const quotationRepository = require('../repositories/quotation.repository');
const auditRepository = require('../repositories/audit.repository');

class QuotationService {
  searchQuotations(params) { return quotationRepository.searchQuotations(params || {}); }
  getFormOptions(branchId) { return quotationRepository.getFormOptions(branchId || 1); }

  saveQuotation(data) {
    if (!data.customer_id) throw new Error('Customer is required');
    if (!data.items || !data.items.length) throw new Error('At least one item is required');

    const existing = data.id ? quotationRepository.findById(data.id) : null;
    const result = quotationRepository.saveQuotation({ ...data, currentUserId: data.currentUserId || null });

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'sales',
      action: data.id ? 'update' : 'create',
      recordId: result.id,
      oldValue: existing ? { customer_id: existing.customer_id, total_amount: existing.total_amount } : null,
      newValue: { id: result.id, quote_number: result.quote_number, total_amount: result.total_amount },
    });

    return result;
  }

  getQuotation(id) { return quotationRepository.getQuotation(id); }

  convertToInvoice(quotationId, data) {
    const result = quotationRepository.convertToInvoice(quotationId, data || {});

    auditRepository.log({
      userId: data.currentUserId || null,
      module: 'sales',
      action: 'convert_to_invoice',
      recordId: quotationId,
      oldValue: { status: 'draft' },
      newValue: { status: 'converted', invoice_id: result.invoice?.id },
    });

    return result;
  }
}

module.exports = new QuotationService();