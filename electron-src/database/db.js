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
const { runSeeders, runDemoSeeds, runAccountingCatalogSeeds, runTaxRuleSeeds, runTaxTemplateSeeds, runDemoInvoiceSeeds, ensureBackupPermissions } = require('./seeders/001_initial_seeds');

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
    
    // Phase 2: Extend tax_rules with tax_type, effective_from, effective_to, is_default
    const taxRulesColumns = dbInstance.prepare('PRAGMA table_info(tax_rules)').all().map((column) => column.name);
    if (!taxRulesColumns.includes('tax_type')) {
      dbInstance.exec("ALTER TABLE tax_rules ADD COLUMN tax_type TEXT NOT NULL DEFAULT 'vat'");
    }
    if (!taxRulesColumns.includes('effective_from')) {
      dbInstance.exec('ALTER TABLE tax_rules ADD COLUMN effective_from DATE');
    }
    if (!taxRulesColumns.includes('effective_to')) {
      dbInstance.exec('ALTER TABLE tax_rules ADD COLUMN effective_to DATE');
    }
    if (!taxRulesColumns.includes('is_default')) {
      dbInstance.exec('ALTER TABLE tax_rules ADD COLUMN is_default INTEGER DEFAULT 0');
    }
    
    // Phase 3: Tax rates and product_tax_class tables
    const tables = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('tax_rates', 'product_tax_class')").all().map(t => t.name);
    if (!tables.includes('tax_rates')) {
      dbInstance.exec(`CREATE TABLE IF NOT EXISTS tax_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code TEXT NOT NULL,
        tax_code TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        tax_type TEXT NOT NULL CHECK (tax_type IN ('vat', 'gst', 'sales_tax', 'withholding', 'other')),
        rate_percentage REAL NOT NULL DEFAULT 0,
        applies_to TEXT NOT NULL CHECK (applies_to IN ('sales', 'purchases', 'both')),
        is_default INTEGER DEFAULT 0,
        is_withholding INTEGER DEFAULT 0,
        effective_from DATE NOT NULL,
        effective_to DATE,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(country_code, tax_code)
      )`);
      dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_tax_rates_country ON tax_rates(country_code)');
      dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_tax_rates_type ON tax_rates(tax_type)');
      dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_tax_rates_applies ON tax_rates(applies_to)');
      dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_tax_rates_effective ON tax_rates(effective_from, effective_to)');
    }
    if (!tables.includes('product_tax_class')) {
      dbInstance.exec(`CREATE TABLE IF NOT EXISTS product_tax_class (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        tax_rate_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (tax_rate_id) REFERENCES tax_rates(id) ON DELETE RESTRICT,
        UNIQUE(product_id, tax_rate_id)
      )`);
    }
  }

  // Run initial seeders
  try {
    ensureBackupPermissions(dbInstance);
    runSeeders(dbInstance);
    runDemoSeeds(dbInstance);
    runAccountingCatalogSeeds(dbInstance);
    runTaxRuleSeeds(dbInstance);
    runTaxTemplateSeeds(dbInstance);
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
