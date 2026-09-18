const quotationRepository = require('../repositories/quotation.repository');

class QuotationService {
  searchQuotations(params) { return quotationRepository.searchQuotations(params || {}); }
  getFormOptions(branchId) { return quotationRepository.getFormOptions(branchId || 1); }
  saveQuotation(data) {
    if (!data.customer_id) throw new Error('العميل مطلوب');
    return quotationRepository.saveQuotation(data);
  }
  getQuotation(id) { return quotationRepository.getQuotation(id); }
  convertToInvoice(quotationId, data) { return quotationRepository.convertToInvoice(quotationId, data || {}); }
}

module.exports = new QuotationService();
