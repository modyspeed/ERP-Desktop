const accountRepository = require('../repositories/account.repository');

class AccountService {
  listAccounts(params) { return accountRepository.listAccounts(params); }
  saveAccount(data) { return accountRepository.saveAccount(data); }
  deleteAccount(id) { if (!id) throw new Error('معرّف الحساب مطلوب'); return accountRepository.softDelete(id); }
  listCatalogs() { return accountRepository.listCatalogs(); }
  createCatalog(data) { return accountRepository.createCatalog(data); }
  applyCatalog(id) { return accountRepository.applyCatalog(id); }
}

module.exports = new AccountService();