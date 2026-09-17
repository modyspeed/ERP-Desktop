const taxRepository = require('../repositories/tax.repository');

class TaxService {
  listRules(params) { return taxRepository.listRules(params); }
  updateRule(id, data) { return taxRepository.updateRule(id, data); }
}

module.exports = new TaxService();