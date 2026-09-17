const bcrypt = require('bcryptjs');

function runSeeders(db) {
  // Check if roles exist
  const existingRole = db.prepare('SELECT COUNT(*) as count FROM roles').get();
  if (existingRole && existingRole.count > 0) {
    return; // Already seeded
  }

  const modules = [
    { key: 'dashboard', name: 'لوحة التحكم' },
    { key: 'users', name: 'إدارة المستخدمين' },
    { key: 'roles', name: 'الأدوار والصلاحيات' },
    { key: 'settings', name: 'الإعدادات العامة' },
    { key: 'audit_logs', name: 'سجل التتبع' },
    { key: 'products', name: 'المنتجات والأصناف' },
    { key: 'inventory', name: 'المخزون والمستودعات' },
    { key: 'sales', name: 'المبيعات والعملاء' },
    { key: 'purchases', name: 'المشتريات والموردين' },
    { key: 'pos', name: 'نقطة البيع POS' },
    { key: 'accounting', name: 'الحسابات والمالية' },
    { key: 'hr', name: 'الموارد البشرية' },
    { key: 'reports', name: 'التقارير' },
    { key: 'backup', name: 'النسخ الاحتياطي' }
  ];

  const actions = [
    { key: 'view', name: 'عرض' },
    { key: 'create', name: 'إضافة' },
    { key: 'edit', name: 'تعديل' },
    { key: 'delete', name: 'حذف' },
    { key: 'print', name: 'طباعة' },
    { key: 'export', name: 'تصدير' }
  ];

  const insertPerm = db.prepare('INSERT INTO permissions (module, action, description) VALUES (?, ?, ?)');
  
  db.transaction(() => {
    // 1. Insert permissions
    for (const mod of modules) {
      for (const act of actions) {
        insertPerm.run(mod.key, act.key, `${act.name} ${mod.name}`);
      }
    }

    // 2. Insert Roles
    const insertRole = db.prepare('INSERT INTO roles (name, description, is_system) VALUES (?, ?, ?)');
    const adminRoleId = insertRole.run('مدير عام (Admin)', 'صلاحيات كاملة للتحكم في جميع أقسام النظام', 1).lastInsertRowid;
    const managerRoleId = insertRole.run('مدير فرع (Manager)', 'إدارة عمليات الفرع والمبيعات والمخزون', 1).lastInsertRowid;
    const accountantRoleId = insertRole.run('محاسب (Accountant)', 'إدارة العمليات المالية والقيود والفواتير', 1).lastInsertRowid;
    const storekeeperRoleId = insertRole.run('أمين مخزن (Storekeeper)', 'إدارة الأصناف والمستودعات وحركات المخزون', 1).lastInsertRowid;
    const cashierRoleId = insertRole.run('كاشير (Cashier)', 'واجهة نقطة البيع والمبيعات السريعة والطباعة', 1).lastInsertRowid;
    const hrRoleId = insertRole.run('موارد بشرية (HR)', 'إدارة الموظفين والرواتب والحضور والإجازات', 1).lastInsertRowid;
    const viewerRoleId = insertRole.run('مشاهد فقط (Viewer)', 'عرض وقراءة البيانات والتقارير دون إمكانية التعديل', 1).lastInsertRowid;

    // 3. Grant Permissions to Admin (All permissions)
    const allPerms = db.prepare('SELECT id, module, action FROM permissions').all();
    const insertRolePerm = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
    
    for (const perm of allPerms) {
      insertRolePerm.run(adminRoleId, perm.id);

      // Cashier permissions
      if (['pos', 'dashboard'].includes(perm.module) || (perm.module === 'sales' && ['view', 'create', 'print'].includes(perm.action))) {
        insertRolePerm.run(cashierRoleId, perm.id);
      }

      // Accountant permissions
      if (['accounting', 'sales', 'purchases', 'reports', 'dashboard'].includes(perm.module) || (perm.module === 'audit_logs' && perm.action === 'view')) {
        insertRolePerm.run(accountantRoleId, perm.id);
      }

      // Storekeeper permissions
      if (['products', 'inventory', 'dashboard'].includes(perm.module) || (perm.module === 'purchases' && ['view', 'create'].includes(perm.action))) {
        insertRolePerm.run(storekeeperRoleId, perm.id);
      }

      // HR permissions
      if (['hr', 'dashboard'].includes(perm.module)) {
        insertRolePerm.run(hrRoleId, perm.id);
      }

      // Viewer permissions
      if (perm.action === 'view' || perm.action === 'export' || perm.action === 'print') {
        insertRolePerm.run(viewerRoleId, perm.id);
      }
    }

    // 4. Create Main Branch
    const insertBranch = db.prepare('INSERT INTO branches (name, address, phone, is_main_branch, is_active) VALUES (?, ?, ?, ?, ?)');
    const mainBranchId = insertBranch.run('الفرع الرئيسي', 'المقر الإداري الرئيسي', '0100000000', 1, 1).lastInsertRowid;

    // 5. Create Default Super Admin User (admin / admin123)
    const passwordHash = bcrypt.hashSync('admin123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (branch_id, full_name, username, password_hash, email, phone, role_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(mainBranchId, 'المدير العام', 'admin', passwordHash, 'admin@erp-system.local', '0500000000', adminRoleId, 1);

    // 6. Create Initial Company Settings
    const insertSettings = db.prepare(`
      INSERT INTO company_settings (
        company_name, address, phone, email, tax_number, currency_code, default_language,
        theme_color, dark_mode_default, invoice_prefix_sales, invoice_prefix_purchase, tax_percentage, tax_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSettings.run(
      'مؤسستي التجارية للحلول المتكاملة',
      'المملكة العربية السعودية - الرياض',
      '+966 50 000 0000',
      'info@company.com',
      '300000000000003',
      'SAR',
      'ar',
      '#2563eb',
      0,
      'INV-',
      'PO-',
      15.0,
      1
    );

    // 7. Seed Initial Units & Categories (Foundation)
    const insertUnit = db.prepare('INSERT INTO units (name, symbol) VALUES (?, ?)');
    insertUnit.run('قطعة', 'حبة');
    insertUnit.run('كيلوجرام', 'كجم');
    insertUnit.run('متر', 'م');
    insertUnit.run('كرتونة', 'كرتون');

    const insertCat = db.prepare('INSERT INTO categories (name, branch_id) VALUES (?, ?)');
    insertCat.run('عام', mainBranchId);
    insertCat.run('إلكترونيات', mainBranchId);
    insertCat.run('مواد غذائية', mainBranchId);

    // 8. Seed Initial Warehouse & Cash Account
    const insertWarehouse = db.prepare('INSERT INTO warehouses (branch_id, name, location) VALUES (?, ?, ?)');
    insertWarehouse.run(mainBranchId, 'المستودع الرئيسي', 'الرياض - المنطقة الصناعية');

    const insertCash = db.prepare('INSERT INTO cash_accounts (branch_id, name, type, opening_balance, current_balance) VALUES (?, ?, ?, ?, ?)');
    insertCash.run(mainBranchId, 'الخزينة الرئيسية', 'cash', 10000, 10000);
    insertCash.run(mainBranchId, 'حساب بنك الراجحي', 'bank', 50000, 50000);

    // 9. Seed Audit Log for system initialization
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (user_id, module, action, record_id, old_value, new_value, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run(1, 'system', 'seed', 1, null, JSON.stringify({ message: 'System database seeded successfully' }), '127.0.0.1');
  })();
}

function runDemoSeeds(db) {
  const branch = db.prepare('SELECT id FROM branches WHERE is_main_branch = 1 ORDER BY id LIMIT 1').get();
  const warehouse = db.prepare('SELECT id FROM warehouses WHERE branch_id = ? AND is_deleted = 0 ORDER BY id LIMIT 1').get(branch?.id || 1);
  const category = db.prepare('SELECT id FROM categories WHERE branch_id = ? AND is_deleted = 0 ORDER BY id LIMIT 1').get(branch?.id || 1);
  const unit = db.prepare('SELECT id FROM units WHERE is_deleted = 0 ORDER BY id LIMIT 1').get();
  if (!branch || !warehouse || !category || !unit) return;

  const hasDemoProducts = db.prepare("SELECT COUNT(*) AS total FROM products WHERE sku LIKE 'DEMO-%'").get().total;
  const hasDemoCustomers = db.prepare("SELECT COUNT(*) AS total FROM customers WHERE phone LIKE '0500000%'").get().total;
  const hasDemoSuppliers = db.prepare("SELECT COUNT(*) AS total FROM suppliers WHERE phone LIKE '0550000%'").get().total;

  db.transaction(() => {
    if (!hasDemoProducts) {
      const products = [
        ['DEMO-001', 'منتج تجريبي - لوحة مفاتيح', '628100000001', 45, 79, 5, 24],
        ['DEMO-002', 'منتج تجريبي - فأرة لاسلكية', '628100000002', 25, 49, 8, 40],
        ['DEMO-003', 'منتج تجريبي - سماعة رأس', '628100000003', 60, 99, 6, 15],
        ['DEMO-004', 'منتج تجريبي - كابل USB-C', '628100000004', 12, 25, 10, 60],
        ['DEMO-005', 'منتج تجريبي - حامل لابتوب', '628100000005', 70, 129, 4, 7],
      ];
      const insertProduct = db.prepare('INSERT INTO products (branch_id, sku, barcode, name, category_id, unit_id, cost_price, sale_price, min_stock_alert, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
      const insertStock = db.prepare('INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES (?, ?, ?)');
      for (const [sku, name, barcode, cost, sale, minimum, quantity] of products) {
        const productId = insertProduct.run(branch.id, sku, barcode, name, category.id, unit.id, cost, sale, minimum).lastInsertRowid;
        insertStock.run(productId, warehouse.id, quantity);
      }
    }

    if (!hasDemoCustomers) {
      const insertCustomer = db.prepare('INSERT INTO customers (branch_id, name, phone, email, address, category, credit_limit) VALUES (?, ?, ?, ?, ?, ?, ?)');
      insertCustomer.run(branch.id, 'عميل تجريبي - شركة الأفق', '0500000001', 'demo.customer1@example.com', 'الرياض', 'شركات', 5000);
      insertCustomer.run(branch.id, 'عميل تجريبي - متجر النخبة', '0500000002', 'demo.customer2@example.com', 'جدة', 'تجزئة', 2500);
    }

    if (!hasDemoSuppliers) {
      const insertSupplier = db.prepare('INSERT INTO suppliers (branch_id, name, phone, email, address, opening_balance) VALUES (?, ?, ?, ?, ?, ?)');
      insertSupplier.run(branch.id, 'مورد تجريبي - التقنية الحديثة', '0550000001', 'demo.supplier1@example.com', 'الرياض', 0);
      insertSupplier.run(branch.id, 'مورد تجريبي - حلول الأعمال', '0550000002', 'demo.supplier2@example.com', 'الدمام', 1200);
    }
  })();
}

function runAccountingCatalogSeeds(db) {
  const catalogs = [
    {
      name: 'الدليل المحاسبي السعودي الأساسي', country: 'SA', description: 'قالب عملي للمنشآت السعودية مع حسابات ضريبة القيمة المضافة بنسبة قابلة للتعديل.',
      accounts: [
        ['1000', 'الأصول', 'asset', null], ['1100', 'النقدية والبنوك', 'asset', '1000'], ['1110', 'الصندوق', 'asset', '1100'], ['1120', 'البنوك', 'asset', '1100'], ['1200', 'العملاء والذمم المدينة', 'asset', '1000'], ['1300', 'المخزون', 'asset', '1000'], ['1400', 'ضريبة القيمة المضافة المدخلة', 'asset', '1000'],
        ['2000', 'الالتزامات', 'liability', null], ['2100', 'الموردون والذمم الدائنة', 'liability', '2000'], ['2200', 'ضريبة القيمة المضافة المحصلة', 'liability', '2000'], ['2300', 'ضريبة القيمة المضافة المستحقة', 'liability', '2000'],
        ['3000', 'حقوق الملكية', 'equity', null], ['3100', 'رأس المال', 'equity', '3000'], ['3200', 'الأرباح المحتجزة', 'equity', '3000'],
        ['4000', 'الإيرادات', 'revenue', null], ['4100', 'مبيعات المنتجات', 'revenue', '4000'], ['4200', 'إيرادات أخرى', 'revenue', '4000'],
        ['5000', 'تكلفة المبيعات', 'expense', null], ['5100', 'تكلفة البضاعة المباعة', 'expense', '5000'], ['6000', 'المصروفات التشغيلية', 'expense', null], ['6100', 'الرواتب والأجور', 'expense', '6000'], ['6200', 'الإيجارات', 'expense', '6000'], ['6300', 'الخدمات والاتصالات', 'expense', '6000'],
      ],
    },
    {
      name: 'الدليل المحاسبي المصري الأساسي', country: 'EG', description: 'قالب عملي للمنشآت المصرية مع حسابات ضريبة القيمة المضافة بنسبة قابلة للتعديل.',
      accounts: [
        ['1000', 'الأصول', 'asset', null], ['1100', 'النقدية والبنوك', 'asset', '1000'], ['1110', 'الخزينة', 'asset', '1100'], ['1120', 'الحسابات البنكية', 'asset', '1100'], ['1200', 'العملاء', 'asset', '1000'], ['1300', 'المخزون السلعي', 'asset', '1000'], ['1400', 'ضريبة القيمة المضافة القابلة للخصم', 'asset', '1000'],
        ['2000', 'الالتزامات', 'liability', null], ['2100', 'الموردون', 'liability', '2000'], ['2200', 'ضريبة القيمة المضافة على المبيعات', 'liability', '2000'], ['2300', 'ضريبة القيمة المضافة المستحقة', 'liability', '2000'],
        ['3000', 'حقوق الملكية', 'equity', null], ['3100', 'رأس المال', 'equity', '3000'], ['3200', 'الأرباح والخسائر المرحلة', 'equity', '3000'],
        ['4000', 'الإيرادات', 'revenue', null], ['4100', 'مبيعات', 'revenue', '4000'], ['4200', 'إيرادات متنوعة', 'revenue', '4000'],
        ['5000', 'تكلفة النشاط', 'expense', null], ['5100', 'تكلفة المبيعات', 'expense', '5000'], ['6000', 'المصروفات العمومية والإدارية', 'expense', null], ['6100', 'الأجور والمرتبات', 'expense', '6000'], ['6200', 'الإيجارات', 'expense', '6000'], ['6300', 'الكهرباء والمياه والاتصالات', 'expense', '6000'],
      ],
    },
  ];

  db.transaction(() => {
    const insertCatalog = db.prepare('INSERT OR IGNORE INTO accounting_catalogs (name, country_code, description, is_system) VALUES (?, ?, ?, 1)');
    const insertAccount = db.prepare('INSERT OR IGNORE INTO accounting_catalog_accounts (catalog_id, code, name, account_type, parent_code, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    for (const catalog of catalogs) {
      insertCatalog.run(catalog.name, catalog.country, catalog.description);
      const catalogRow = db.prepare('SELECT id FROM accounting_catalogs WHERE name = ?').get(catalog.name);
      catalog.accounts.forEach(([code, name, type, parentCode], index) => insertAccount.run(catalogRow.id, code, name, type, parentCode, index));
    }
    db.prepare('INSERT OR IGNORE INTO accounting_preferences (id, active_catalog_id) VALUES (1, NULL)').run();
  })();
}

function runTaxRuleSeeds(db) {
  const countries = [
    { code: 'SA', vat: 15, vatName: 'ضريبة القيمة المضافة السعودية', wht: 5 },
    { code: 'EG', vat: 14, vatName: 'ضريبة القيمة المضافة المصرية', wht: 3 },
    { code: 'AE', vat: 5, vatName: 'ضريبة القيمة المضافة الإماراتية', wht: 0 },
    { code: 'BH', vat: 10, vatName: 'ضريبة القيمة المضافة البحرينية', wht: 0 },
    { code: 'OM', vat: 5, vatName: 'ضريبة القيمة المضافة العُمانية', wht: 0 },
    { code: 'KW', vat: 5, vatName: 'ضريبة القيمة المضافة الكويتية', wht: 0 },
    { code: 'QA', vat: 0, vatName: 'ضريبة القيمة المضافة القطرية', wht: 0 },
  ];
  const insert = db.prepare('INSERT OR IGNORE INTO tax_rules (country_code, transaction_type, name, short_name, rate, calculation_method, is_enabled, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (const country of countries) {
      insert.run(country.code, 'sale', country.vatName, 'VAT', country.vat, 'additive', 1, 'ضريبة مبيعات / مخرجات');
      insert.run(country.code, 'purchase', country.vatName, 'VAT', country.vat, 'input', 1, 'ضريبة مشتريات / مدخلات قابلة للخصم محاسبياً');
      insert.run(country.code, 'service', country.vatName, 'VAT', country.vat, 'additive', 1, 'خدمات');
      insert.run(country.code, 'consulting', country.vatName, 'VAT', country.vat, 'additive', 1, 'استشارات');
      if (country.wht > 0) {
        insert.run(country.code, 'service', 'ضريبة الخصم والتحصيل على الخدمات', 'WHT', country.wht, 'withholding', 0, 'تفعيلها يعتمد على نوع المورد والإقامة والعقد واللوائح المحلية');
        insert.run(country.code, 'consulting', 'ضريبة الخصم والتحصيل على الاستشارات', 'WHT', country.wht, 'withholding', 0, 'تفعيلها يعتمد على نوع المورد والإقامة والعقد واللوائح المحلية');
      }
    }
  })();
}

function runDemoInvoiceSeeds(db) {
  const exists = db.prepare("SELECT COUNT(*) AS total FROM sales_invoices WHERE invoice_number = 'DEMO-SALE-001'").get().total;
  if (exists) return;
  const branch = db.prepare('SELECT id FROM branches WHERE is_main_branch = 1 ORDER BY id LIMIT 1').get();
  const warehouse = db.prepare('SELECT id FROM warehouses WHERE branch_id = ? AND is_deleted = 0 ORDER BY id LIMIT 1').get(branch?.id || 1);
  const customer = db.prepare("SELECT id FROM customers WHERE phone = '0500000001' LIMIT 1").get();
  const supplier = db.prepare("SELECT id FROM suppliers WHERE phone = '0550000001' LIMIT 1").get();
  const products = db.prepare("SELECT id, name, cost_price, sale_price FROM products WHERE sku LIKE 'DEMO-%' ORDER BY id LIMIT 3").all();
  if (!branch || !warehouse || !customer || !supplier || products.length < 3) return;

  db.transaction(() => {
    const settings = db.prepare('SELECT tax_country_code, sales_tax_percentage, purchase_tax_percentage FROM company_settings LIMIT 1').get() || {};
    const salesRate = Number(settings.sales_tax_percentage ?? 15);
    const purchaseRate = Number(settings.purchase_tax_percentage ?? 15);
    const saleSubtotal = products[0].sale_price * 2 + products[1].sale_price;
    const saleTax = saleSubtotal * salesRate / 100;
    const saleTotal = saleSubtotal + saleTax;
    const saleDetails = JSON.stringify([{ name: 'ضريبة القيمة المضافة السعودية', short_name: 'VAT', rate: salesRate, amount: saleTax }]);
    const sale = db.prepare("INSERT INTO sales_invoices (branch_id, invoice_number, customer_id, warehouse_id, date, subtotal, tax_amount, tax_details, total, paid_amount, remaining_amount, payment_status, invoice_type, source, created_by) VALUES (?, 'DEMO-SALE-001', ?, ?, date('now'), ?, ?, ?, ?, ?, ?, 'partial', 'credit', 'manual', 1)").run(branch.id, customer.id, warehouse.id, saleSubtotal, saleTax, saleDetails, saleTotal, saleTotal / 2, saleTotal / 2);
    const saleItem = db.prepare('INSERT INTO sales_invoice_items (invoice_id, product_id, qty, unit_price, line_total) VALUES (?, ?, ?, ?, ?)');
    const decrease = db.prepare('UPDATE stock_levels SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ?');
    const movementOut = db.prepare("INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'out', ?, 'sales_invoice', ?, 'فاتورة بيع تجريبية', 1)");
    saleItem.run(sale.lastInsertRowid, products[0].id, 2, products[0].sale_price, products[0].sale_price * 2);
    saleItem.run(sale.lastInsertRowid, products[1].id, 1, products[1].sale_price, products[1].sale_price);
    decrease.run(2, products[0].id, warehouse.id); decrease.run(1, products[1].id, warehouse.id);
    movementOut.run(branch.id, products[0].id, warehouse.id, 2, sale.lastInsertRowid); movementOut.run(branch.id, products[1].id, warehouse.id, 1, sale.lastInsertRowid);
    db.prepare('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?').run(saleTotal / 2, customer.id);

    const purchaseSubtotal = products[2].cost_price * 4;
    const purchaseTax = purchaseSubtotal * purchaseRate / 100;
    const purchaseTotal = purchaseSubtotal + purchaseTax;
    const purchaseDetails = JSON.stringify([{ name: 'ضريبة القيمة المضافة السعودية', short_name: 'VAT', rate: purchaseRate, amount: purchaseTax }]);
    const purchase = db.prepare("INSERT INTO purchase_invoices (branch_id, invoice_number, supplier_id, warehouse_id, date, subtotal, tax_amount, tax_details, total, paid_amount, remaining_amount, payment_status, created_by) VALUES (?, 'DEMO-PURCHASE-001', ?, ?, date('now'), ?, ?, ?, ?, ?, ?, 'unpaid', 1)").run(branch.id, supplier.id, warehouse.id, purchaseSubtotal, purchaseTax, purchaseDetails, purchaseTotal, 0, purchaseTotal);
    db.prepare('INSERT INTO purchase_invoice_items (invoice_id, product_id, qty, unit_cost, line_total) VALUES (?, ?, ?, ?, ?)').run(purchase.lastInsertRowid, products[2].id, 4, products[2].cost_price, purchaseSubtotal);
    db.prepare('INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES (?, ?, ?) ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + excluded.quantity').run(products[2].id, warehouse.id, 4);
    db.prepare("INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'in', ?, 'purchase_invoice', ?, 'فاتورة شراء تجريبية', 1)").run(branch.id, products[2].id, warehouse.id, 4, purchase.lastInsertRowid);
    db.prepare('UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?').run(purchaseTotal, supplier.id);
  })();
}

module.exports = { runSeeders, runDemoSeeds, runAccountingCatalogSeeds, runTaxRuleSeeds, runDemoInvoiceSeeds };
