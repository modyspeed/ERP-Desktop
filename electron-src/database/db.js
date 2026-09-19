const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let electronApp = null;
try {
  const electron = require('electron');
  electronApp = electron.app;
} catch (e) {
  electronApp = null;
}
const { runSeeders, runDemoSeeds, runAccountingCatalogSeeds, runTaxRuleSeeds, runDemoInvoiceSeeds } = require('./seeders/001_initial_seeds');

let dbInstance = null;

function getDbPath() {
  const isDev = !electronApp || !electronApp.isPackaged;
  if (isDev) {
    return path.join(process.cwd(), 'erp.db');
  }
  const userDataPath = electronApp.getPath('userData');
  return path.join(userDataPath, 'erp.db');
}

function initDatabase() {
  if (dbInstance) return dbInstance;

  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? null : null,
  });

  // Optimize SQLite performance
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('synchronous = NORMAL');
  dbInstance.pragma('foreign_keys = ON');

  // Run schema migrations
  const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  if (fs.existsSync(migrationPath)) {
    const schemaSql = fs.readFileSync(migrationPath, 'utf8');
    dbInstance.exec(schemaSql);
    const settingsColumns = dbInstance.prepare('PRAGMA table_info(company_settings)').all().map((column) => column.name);
    if (!settingsColumns.includes('calendar_type')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN calendar_type TEXT DEFAULT 'gregorian'");
    }
    if (!settingsColumns.includes('tax_country_code')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN tax_country_code TEXT DEFAULT 'SA'");
    }
    if (!settingsColumns.includes('sales_tax_percentage')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN sales_tax_percentage REAL DEFAULT 15.0");
    }
    if (!settingsColumns.includes('purchase_tax_percentage')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN purchase_tax_percentage REAL DEFAULT 15.0");
    }
    // New columns for Phase 1
    if (!settingsColumns.includes('country_code')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN country_code TEXT DEFAULT 'SA'");
    }
    if (!settingsColumns.includes('exchange_rate')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN exchange_rate REAL DEFAULT 1.0");
    }
    if (!settingsColumns.includes('date_format')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN date_format TEXT DEFAULT 'dd/MM/yyyy'");
    }
    if (!settingsColumns.includes('font_family')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN font_family TEXT DEFAULT 'Cairo'");
    }
    if (!settingsColumns.includes('tax_type')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN tax_type TEXT DEFAULT 'VAT'");
    }
    if (!settingsColumns.includes('coa_template_code')) {
      dbInstance.exec("ALTER TABLE company_settings ADD COLUMN coa_template_code TEXT");
    }
    const quotationColumns = dbInstance.prepare('PRAGMA table_info(quotations)').all().map((column) => column.name);
    if (!quotationColumns.includes('notes')) dbInstance.exec('ALTER TABLE quotations ADD COLUMN notes TEXT');
    const purchaseOrderColumns = dbInstance.prepare('PRAGMA table_info(purchase_orders)').all().map((column) => column.name);
    if (!purchaseOrderColumns.includes('notes')) dbInstance.exec('ALTER TABLE purchase_orders ADD COLUMN notes TEXT');
    const salesInvoiceColumns = dbInstance.prepare('PRAGMA table_info(sales_invoices)').all().map((column) => column.name);
    if (!salesInvoiceColumns.includes('tax_details')) dbInstance.exec('ALTER TABLE sales_invoices ADD COLUMN tax_details TEXT');
    const purchaseInvoiceColumns = dbInstance.prepare('PRAGMA table_info(purchase_invoices)').all().map((column) => column.name);
    if (!purchaseInvoiceColumns.includes('tax_details')) dbInstance.exec('ALTER TABLE purchase_invoices ADD COLUMN tax_details TEXT');
  }

  // Run initial seeders
  try {
    runSeeders(dbInstance);
    runDemoSeeds(dbInstance);
    runAccountingCatalogSeeds(dbInstance);
    runTaxRuleSeeds(dbInstance);
    runDemoInvoiceSeeds(dbInstance);
  } catch (err) {
    console.error('Error running seeders:', err);
  }

  return dbInstance;
}

function getDatabase() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  getDbPath,
};
