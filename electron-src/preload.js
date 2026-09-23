const { contextBridge, ipcRenderer } = require('electron');

function getUserId() {
  try {
    const userId = Number(localStorage.getItem('app_user_id'));
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

function withUserId(payload) {
  const userId = getUserId();
  if (!userId) return payload;
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    return { ...payload, _userId: userId };
  }
  if (typeof payload === 'number') {
    return { id: payload, _userId: userId };
  }
  return payload;
}

function invokeWithUser(channel, payload) {
  const userId = getUserId();
  if (!userId) return ipcRenderer.invoke(channel, payload);
  if (payload === undefined || payload === null) {
    return ipcRenderer.invoke(channel, { _userId: userId });
  }
  if (typeof payload === 'string' && (channel === 'backup:restore' || channel === 'backup:delete')) {
    return ipcRenderer.invoke(channel, { filePath: payload, _userId: userId });
  }
  return ipcRenderer.invoke(channel, withUserId(payload));
}

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => {
    if (args.length === 0) return invokeWithUser(channel);
    if (args.length === 1) return invokeWithUser(channel, args[0]);
    return ipcRenderer.invoke(channel, ...args.map(withUserId));
  },

  auth: {
    login: (credentials) => invokeWithUser('auth:login', credentials),
    changePassword: (params) => invokeWithUser('auth:change-password', params),
    getCurrentUser: (userId) => invokeWithUser('auth:get-current-user', userId),
  },

  users: {
    search: (params) => invokeWithUser('users:search', params),
    get: (id) => invokeWithUser('users:get', id),
    create: (userData) => invokeWithUser('users:create', userData),
    update: (userData) => invokeWithUser('users:update', userData),
    delete: (params) => invokeWithUser('users:delete', params),
  },
  roles: {
    list: () => invokeWithUser('roles:list'),
    save: (roleData) => invokeWithUser('roles:save', roleData),
    delete: (params) => invokeWithUser('roles:delete', params),
  },
  permissions: {
    list: () => invokeWithUser('permissions:list'),
  },

  settings: {
    get: () => invokeWithUser('settings:get'),
    update: (params) => invokeWithUser('settings:update', params),
    uploadLogo: (params) => invokeWithUser('settings:upload-logo', params),
  },
  branches: {
    list: () => invokeWithUser('branches:list'),
    save: (branchData) => invokeWithUser('branches:save', branchData),
    delete: (params) => invokeWithUser('branches:delete', params),
  },

  countries: {
    list: () => invokeWithUser('countries:list'),
  },
  currencies: {
    list: () => invokeWithUser('currencies:list'),
  },
  fonts: {
    list: () => invokeWithUser('fonts:list'),
  },

  audit: {
    search: (params) => invokeWithUser('audit:search', params),
    getModules: () => invokeWithUser('audit:modules'),
  },

  dashboard: {
    getMetrics: (branchId) => invokeWithUser('dashboard:get-metrics', branchId),
    getCharts: () => invokeWithUser('dashboard:get-charts'),
    getAlerts: () => invokeWithUser('dashboard:get-alerts'),
    getActivities: (limit) => invokeWithUser('dashboard:get-activities', limit),
  },

  products: {
    search: (params) => invokeWithUser('products:search', params),
    categories: (branchId) => invokeWithUser('products:categories', branchId),
    save: (data) => invokeWithUser('products:save', data),
    delete: (id) => invokeWithUser('products:delete', id),
  },

  customers: {
    search: (params) => invokeWithUser('customers:search', params),
    save: (data) => invokeWithUser('customers:save', data),
    delete: (id) => invokeWithUser('customers:delete', id),
  },

  sales: {
    invoices: (params) => invokeWithUser('sales:invoices', params),
    options: (branchId) => invokeWithUser('sales:options', branchId),
    createInvoice: (data) => invokeWithUser('sales:create-invoice', data),
    unpaidInvoices: (params) => invokeWithUser('sales:unpaid-invoices', params),
    collectPayment: (data) => invokeWithUser('sales:collect-payment', data),
  },

  suppliers: {
    search: (params) => invokeWithUser('suppliers:search', params),
    save: (data) => invokeWithUser('suppliers:save', data),
    delete: (id) => invokeWithUser('suppliers:delete', id),
  },

  purchases: {
    invoices: (params) => invokeWithUser('purchases:invoices', params),
    options: (branchId) => invokeWithUser('purchases:options', branchId),
    createInvoice: (data) => invokeWithUser('purchases:create-invoice', data),
  },

  accounts: {
    list: (params) => invokeWithUser('accounts:list', params),
    save: (data) => invokeWithUser('accounts:save', data),
    delete: (id) => invokeWithUser('accounts:delete', id),
    catalogs: () => invokeWithUser('accounts:catalogs'),
    createCatalog: (data) => invokeWithUser('accounts:create-catalog', data),
    applyCatalog: (id) => invokeWithUser('accounts:apply-catalog', id),
    applyCatalogFromTemplate: (template) => invokeWithUser('accounts:apply-catalog-from-template', template),
    coaTemplates: () => invokeWithUser('coa-templates:list'),
  },

  journal: {
    list: (params) => invokeWithUser('journal:list', params),
  },

  categories: {
    list: (branchId) => invokeWithUser('categories:list', branchId),
    save: (data) => invokeWithUser('categories:save', data),
    delete: (id) => invokeWithUser('categories:delete', id),
  },

  tables: {
    list: (params) => invokeWithUser('tables:list', params),
    save: (data) => invokeWithUser('tables:save', data),
    updateStatus: (params) => invokeWithUser('tables:update-status', params),
    delete: (params) => invokeWithUser('tables:delete', params),
  },

  taxes: {
    list: (params) => invokeWithUser('taxes:list', params),
    update: (data) => invokeWithUser('taxes:update', data),
    create: (data) => invokeWithUser('taxes:create', data),
    delete: (params) => invokeWithUser('taxes:delete', params),
    taxTypes: () => invokeWithUser('taxes:tax-types'),
    templates: {
      list: () => invokeWithUser('tax-templates:list'),
      load: (countryCode) => invokeWithUser('tax-templates:load', countryCode),
      apply: (countryCode) => invokeWithUser('tax-templates:apply', countryCode),
    },
  },

  backup: {
    list: () => invokeWithUser('backup:list'),
    create: () => invokeWithUser('backup:create'),
    restore: (filePath) => invokeWithUser('backup:restore', filePath),
    delete: (filePath) => invokeWithUser('backup:delete', filePath),
  },

  warehouses: {
    search: (params) => invokeWithUser('warehouses:search', params),
    stock: (warehouseId) => invokeWithUser('warehouses:stock', warehouseId),
    save: (data) => invokeWithUser('warehouses:save', data),
    transfer: (data) => invokeWithUser('warehouses:transfer', data),
  },

  purchaseOrders: {
    search: (params) => invokeWithUser('purchase-orders:search', params),
    options: (branchId) => invokeWithUser('purchase-orders:options', branchId),
    save: (data) => invokeWithUser('purchase-orders:save', data),
    get: (id) => invokeWithUser('purchase-orders:get', id),
    convertToInvoice: (data) => invokeWithUser('purchase-orders:convert-to-invoice', data),
  },

  returns: {
    salesSearch: (params) => invokeWithUser('returns:sales-search', params),
    salesGet: (id) => invokeWithUser('returns:sales-get', id),
    salesCreate: (data) => invokeWithUser('returns:sales-create', data),
    purchasesSearch: (params) => invokeWithUser('returns:purchases-search', params),
    purchasesGet: (id) => invokeWithUser('returns:purchases-get', id),
    purchasesCreate: (data) => invokeWithUser('returns:purchases-create', data),
  },

  quotations: {
    search: (params) => invokeWithUser('quotations:search', params),
    options: (branchId) => invokeWithUser('quotations:options', branchId),
    save: (data) => invokeWithUser('quotations:save', data),
    get: (id) => invokeWithUser('quotations:get', id),
    convertToInvoice: (data) => invokeWithUser('quotations:convert-to-invoice', data),
  },

  reports: {
    profitLoss: (params) => invokeWithUser('reports:profit-loss', params),
    inventoryMovement: (params) => invokeWithUser('reports:inventory-movement', params),
    taxReport: (params) => invokeWithUser('reports:tax-report', params),
    salesSummary: (params) => invokeWithUser('reports:sales-summary', params),
  },

  hr: {
    employees: (params) => invokeWithUser('hr:employees-search', params),
    employeeOptions: (branchId) => invokeWithUser('hr:employees-options', branchId),
    employeeSave: (data) => invokeWithUser('hr:employee-save', data),
    employeeDelete: (id) => invokeWithUser('hr:employee-delete', id),
    attendance: (params) => invokeWithUser('hr:attendance-search', params),
    attendanceSummary: (params) => invokeWithUser('hr:attendance-summary', params),
    attendanceUpsert: (data) => invokeWithUser('hr:attendance-upsert', data),
    leaves: (params) => invokeWithUser('hr:leaves-search', params),
    leaveSave: (data) => invokeWithUser('hr:leave-save', data),
    payrolls: (params) => invokeWithUser('hr:payrolls-search', params),
    payrollGenerate: (data) => invokeWithUser('hr:payroll-generate', data),
  },

  hardware: {
    printReceipt: (params) => invokeWithUser('hardware:print-receipt', params),
    openCashDrawer: () => invokeWithUser('hardware:open-cashdrawer'),
  },

  pos: {
    activeSession: (params) => invokeWithUser('pos:active-session', params),
    openSession: (data) => invokeWithUser('pos:open-session', data),
    closeSession: (data) => invokeWithUser('pos:close-session', data),
    sessionStats: (params) => invokeWithUser('pos:session-stats', params),
  },

  importData: {
    selectFile: (params) => invokeWithUser('import:select-file', params),
    apply: (data) => invokeWithUser('import:apply', data),
  },
});
