const fs = require('fs');
const path = require('path');
const accountService = require('../services/account.service');

function registerAccountsIPC(ipcMain) {
  ipcMain.handle('accounts:list', async (event, params) => {
    try { return { success: true, data: accountService.listAccounts(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:save', async (event, data) => {
    try { return { success: true, data: accountService.saveAccount(data), message: 'تم حفظ الحساب بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:delete', async (event, id) => {
    const accountId = typeof id === 'object' && id !== null ? id.id : id;
    try { accountService.deleteAccount(accountId); return { success: true, message: 'تم حذف الحساب بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:catalogs', async () => {
    try { return { success: true, data: accountService.listCatalogs() }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:create-catalog', async (event, data) => {
    try { accountService.createCatalog(data); return { success: true, message: 'تم إنشاء الدليل المخصص بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('accounts:apply-catalog', async (event, id) => {
    const catalogId = typeof id === 'object' && id !== null ? id.id : id;
    try { return { success: true, data: accountService.applyCatalog(catalogId), message: 'تم تطبيق الدليل المحاسبي بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  // COA Templates
  ipcMain.handle('coa-templates:list', async () => {
    try {
      const templatesDir = path.join(__dirname, '..', 'database', 'coa-templates');
      if (!fs.existsSync(templatesDir)) return { success: true, data: [] };
      
      const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
      const templates = [];
      
      for (const file of files) {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const accounts = JSON.parse(content);
        
        const countryCode = file.replace('.json', '');
        const countryNames = {
          'eg': 'مصر',
          'sa': 'السعودية',
          'ae': 'الإمارات',
          'generic': 'عام'
        };
        
        templates.push({
          id: file.replace('.json', ''),
          name: `الدليل المحاسبي ${countryNames[file.replace('.json', '')] || file}`,
          country_code: countryCode,
          accounts_count: accounts.length,
          accounts: accounts,
          is_active: false
        });
      }
      
      return { success: true, data: templates };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  
  ipcMain.handle('accounts:apply-catalog-from-template', async (event, template) => {
    try {
      const result = accountService.applyCatalogFromTemplate(template);
      return { success: true, data: result, message: 'تم تطبيق القالب المحاسبي بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Journal entries
  ipcMain.handle('journal:list', async (event, params) => {
    try { return { success: true, data: accountService.listJournalEntries(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerAccountsIPC;