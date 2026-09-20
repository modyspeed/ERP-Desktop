const taxRepository = require('../repositories/tax.repository');
const { TAX_TYPE_CATALOG } = require('../repositories/tax.repository');

class TaxService {
  listRules(params) { return taxRepository.listRules(params); }
  updateRule(id, data) { return taxRepository.updateRule(id, data); }
  createRule(data) { return taxRepository.createRule(data); }
  deleteRule(id) { return taxRepository.deleteRule(id); }
  getTaxTypeCatalog() { return TAX_TYPE_CATALOG; }
}

module.exports = new TaxService();