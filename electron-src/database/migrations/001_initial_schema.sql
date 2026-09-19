-- Database Initial Schema for ERP Desktop
-- Based on Section 12 of ERP-Desktop-Requirements.md

PRAGMA foreign_keys = ON;

-- 12.1 Users & Permissions
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  role_id INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id INTEGER,
  old_value TEXT, -- JSON
  new_value TEXT, -- JSON
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 12.2 Company Settings & Branches
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL DEFAULT 'مؤسستي التجارية',
  logo_path TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_number TEXT,
  currency_code TEXT DEFAULT 'SAR',
  secondary_currency_code TEXT,
  exchange_rate REAL DEFAULT 1.0,
  default_language TEXT DEFAULT 'ar',
  theme_color TEXT DEFAULT '#2563eb',
  dark_mode_default INTEGER DEFAULT 0,
  invoice_prefix_sales TEXT DEFAULT 'INV-',
  invoice_prefix_purchase TEXT DEFAULT 'PO-',
  tax_percentage REAL DEFAULT 15.0,
  sales_tax_percentage REAL DEFAULT 15.0,
  purchase_tax_percentage REAL DEFAULT 15.0,
  tax_enabled INTEGER DEFAULT 1,
  tax_country_code TEXT DEFAULT 'SA',
  country_code TEXT DEFAULT 'SA',
  calendar_type TEXT DEFAULT 'gregorian',
  date_format TEXT DEFAULT 'dd/MM/yyyy',
  font_family TEXT DEFAULT 'Cairo',
  tax_type TEXT DEFAULT 'VAT',
  coa_template_code TEXT,
  tax_details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_main_branch INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

-- 12.3 Inventory & Products (Foundation for Phase 2)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  parent_id INTEGER,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id INTEGER,
  unit_id INTEGER,
  cost_price REAL DEFAULT 0,
  sale_price REAL DEFAULT 0,
  tax_included INTEGER DEFAULT 1,
  min_stock_alert REAL DEFAULT 5,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_path TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  location TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS stock_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL,
  quantity REAL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  product_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL, -- 'in', 'out', 'transfer', 'adjustment'
  quantity REAL NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- 12.4 Customers & Suppliers
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  credit_limit REAL DEFAULT 0,
  opening_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  category TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  opening_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

-- 12.5 Sales
CREATE TABLE IF NOT EXISTS quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  customer_id INTEGER NOT NULL,
  quote_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'draft',
  total_amount REAL DEFAULT 0,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER,
  warehouse_id INTEGER NOT NULL,
  date DATE NOT NULL,
  subtotal REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  tax_details TEXT,
  total REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'paid', -- 'paid', 'partial', 'unpaid'
  invoice_type TEXT DEFAULT 'cash', -- 'cash', 'credit'
  source TEXT DEFAULT 'manual', -- 'pos', 'manual'
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  line_total REAL NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sales_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  invoice_id INTEGER NOT NULL,
  return_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  total_amount REAL DEFAULT 0,
  reason TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
);

CREATE TABLE IF NOT EXISTS sales_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty REAL NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 12.6 Purchases
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  supplier_id INTEGER NOT NULL,
  po_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  total_amount REAL DEFAULT 0,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty REAL NOT NULL,
  unit_cost REAL NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  invoice_number TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL,
  date DATE NOT NULL,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  tax_details TEXT,
  total REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'paid',
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty REAL NOT NULL,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS purchase_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  invoice_id INTEGER NOT NULL,
  return_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  total_amount REAL DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id)
);

CREATE TABLE IF NOT EXISTS purchase_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty REAL NOT NULL,
  unit_cost REAL NOT NULL,
  FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 12.7 POS
CREATE TABLE IF NOT EXISTS pos_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  cashier_id INTEGER NOT NULL,
  opening_balance REAL DEFAULT 0,
  closing_balance REAL DEFAULT 0,
  expected_balance REAL DEFAULT 0,
  difference REAL DEFAULT 0,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  status TEXT DEFAULT 'open', -- 'open', 'closed'
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS pos_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  invoice_id INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'cash', -- 'cash', 'card', 'mixed', 'credit'
  amount_paid REAL NOT NULL,
  change_due REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES pos_sessions(id),
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id)
);

-- 12.8 Accounting
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
  parent_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id)
);

CREATE TABLE IF NOT EXISTS accounting_catalogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  country_code TEXT,
  description TEXT,
  is_system INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounting_catalog_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  parent_code TEXT,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (catalog_id) REFERENCES accounting_catalogs(id) ON DELETE CASCADE,
  UNIQUE(catalog_id, code)
);

CREATE TABLE IF NOT EXISTS accounting_preferences (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_catalog_id INTEGER,
  FOREIGN KEY (active_catalog_id) REFERENCES accounting_catalogs(id)
);

CREATE TABLE IF NOT EXISTS tax_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  rate REAL DEFAULT 0,
  calculation_method TEXT NOT NULL DEFAULT 'additive',
  is_enabled INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country_code, transaction_type, name)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  entry_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id INTEGER,
  is_posted INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);

CREATE TABLE IF NOT EXISTS cash_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'cash', -- 'cash', 'bank'
  opening_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cash_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  cash_account_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'in', 'out'
  amount REAL NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cash_account_id) REFERENCES cash_accounts(id)
);

-- 12.9 HR
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position TEXT,
  department TEXT,
  salary_base REAL DEFAULT 0,
  hire_date DATE,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'present',
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS payrolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  employee_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  base_salary REAL NOT NULL,
  allowances REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net_salary REAL NOT NULL,
  journal_entry_id INTEGER,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
);

-- 12.10 Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  related_type TEXT NOT NULL,
  related_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_name TEXT,
  uploaded_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12.11 Countries
CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE, -- ISO 3166-1 alpha-2
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  default_currency_code TEXT,
  default_tax_type TEXT,
  default_tax_percentage REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12.12 Currencies
CREATE TABLE IF NOT EXISTS currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE, -- ISO 4217
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  symbol TEXT,
  decimal_places INTEGER DEFAULT 2,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12.13 Fonts
CREATE TABLE IF NOT EXISTS fonts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  font_file_path TEXT, -- relative path to font file in assets/fonts
  supports_arabic INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
