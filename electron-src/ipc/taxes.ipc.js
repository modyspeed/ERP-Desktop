const fs = require('fs');
const path = require('path');
const taxService = require('../services/tax.service');

function registerTaxesIPC(ipcMain) {
  ipcMain.handle('taxes:list', async (event, params) => {
    try { return { success: true, data: taxService.listRules(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('taxes:update', async (event, { id, ...data }) => {
    try { return { success: true, data: taxService.updateRule(id, data), message: 'تم تحديث إعداد الضريبة' }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('taxes:create', async (event, data) => {
    try { return { success: true, data: taxService.createRule(data), message: 'تم إضافة نوع الضريبة بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('taxes:delete', async (event, { id }) => {
    try { return { success: true, data: taxService.deleteRule(id), message: 'تم حذف نوع الضريبة' }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('taxes:tax-types', async () => {
    try { return { success: true, data: taxService.getTaxTypeCatalog() }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  // Tax Templates
  ipcMain.handle('tax-templates:list', async () => {
    try {
      const templatesDir = path.join(__dirname, '..', 'database', 'tax-templates');
      if (!fs.existsSync(templatesDir)) return { success: true, data: [] };

      const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
      const templates = [];

      for (const file of files) {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const template = JSON.parse(content);
        const countryCode = template.country_code || file.replace('.json', '');
        const taxes = template.tax_rates || [];

        templates.push({
          id: countryCode,
          name: `قالب الضرائب ${countryCode.toUpperCase()}`,
          country_code: countryCode,
          taxes_count: taxes.length,
          taxes: taxes,
          is_active: false
        });
      }

      return { success: true, data: templates };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Load tax template for a country
  ipcMain.handle('tax-templates:load', async (event, countryCode) => {
    try {
      const filePath = path.join(__dirname, '..', 'database', 'tax-templates', `${countryCode}.json`);
      if (!fs.existsSync(filePath)) return { success: false, error: 'Template not found' };

      const content = fs.readFileSync(filePath, 'utf8');
      const template = JSON.parse(content);
      const taxes = template.tax_rates || [];

      return { success: true, data: { countryCode, taxes } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Apply tax template (load into tax_rates table)
  ipcMain.handle('tax-templates:apply', async (event, countryCode) => {
    try {
      const filePath = path.join(__dirname, '..', 'database', 'tax-templates', `${countryCode}.json`);
      if (!fs.existsSync(filePath)) return { success: false, error: 'Template not found' };

      const content = fs.readFileSync(filePath, 'utf8');
      const template = JSON.parse(content);
      const taxes = template.tax_rates || [];

      // Insert into tax_rates table
      const { getDatabase } = require('../database/db');
      const db = getDatabase();

      const insertTax = db.prepare('INSERT OR IGNORE INTO tax_rates (country_code, tax_code, name_ar, name_en, tax_type, rate_percentage, applies_to, is_default, is_withholding, effective_from, effective_to, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

      let inserted = 0;
      for (const tax of taxes) {
        const result = insertTax.run(
          countryCode,
          tax.tax_code,
          tax.name_ar,
          tax.name_en,
          tax.tax_type,
          tax.rate_percentage,
          tax.applies_to,
          tax.is_default ? 1 : 0,
          tax.is_withholding ? 1 : 0,
          tax.effective_from,
          tax.effective_to || null,
          tax.is_active ? 1 : 0
        );
        if (result.changes > 0) inserted++;
      }

      return { success: true, data: { inserted }, message: `تم تحميل ${inserted} ضريبة بنجاح` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerTaxesIPC;