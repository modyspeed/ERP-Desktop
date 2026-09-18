const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Generic invoke
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // Authentication
  auth: {
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    changePassword: (params) => ipcRenderer.invoke('auth:change-password', params),
    getCurrentUser: (userId) => ipcRenderer.invoke('auth:get-current-user', userId),
  },

  // Users & Roles & Permissions
  users: {
    search: (params) => ipcRenderer.invoke('users:search', params),
    get: (id) => ipcRenderer.invoke('users:get', id),
    create: (userData) => ipcRenderer.invoke('users:create', userData),
    update: (userData) => ipcRenderer.invoke('users:update', userData),
    delete: (params) => ipcRenderer.invoke('users:delete', params),
  },
  roles: {
    list: () => ipcRenderer.invoke('roles:list'),
    save: (roleData) => ipcRenderer.invoke('roles:save', roleData),
    delete: (params) => ipcRenderer.invoke('roles:delete', params),
  },
  permissions: {
    list: () => ipcRenderer.invoke('permissions:list'),
  },

  // Settings & Branches
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (params) => ipcRenderer.invoke('settings:update', params),
    uploadLogo: (params) => ipcRenderer.invoke('settings:upload-logo', params),
  },
  branches: {
    list: () => ipcRenderer.invoke('branches:list'),
    save: (branchData) => ipcRenderer.invoke('branches:save', branchData),
    delete: (params) => ipcRenderer.invoke('branches:delete', params),
  },

  // Audit Logs
  audit: {
    search: (params) => ipcRenderer.invoke('audit:search', params),
    getModules: () => ipcRenderer.invoke('audit:modules'),
  },

  // Dashboard Analytics
  dashboard: {
    getMetrics: (branchId) => ipcRenderer.invoke('dashboard:get-metrics', branchId),
    getCharts: () => ipcRenderer.invoke('dashboard:get-charts'),
    getAlerts: () => ipcRenderer.invoke('dashboard:get-alerts'),
    getActivities: (limit) => ipcRenderer.invoke('dashboard:get-activities', limit),
  },

  // Inventory & Products
  products: {
    search: (params) => ipcRenderer.invoke('products:search', params),
    categories: (branchId) => ipcRenderer.invoke('products:categories', branchId),
    save: (data) => ipcRenderer.invoke('products:save', data),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
  },

  // Sales & Customers
  customers: {
    search: (params) => ipcRenderer.invoke('customers:search', params),
    save: (data) => ipcRenderer.invoke('customers:save', data),
    delete: (id) => ipcRenderer.invoke('customers:delete', id),
  },

  // Sales Invoices
  sales: {
    invoices: (params) => ipcRenderer.invoke('sales:invoices', params),
    options: (branchId) => ipcRenderer.invoke('sales:options', branchId),
    createInvoice: (data) => ipcRenderer.invoke('sales:create-invoice', data),
  },

  // Purchases & Suppliers
  suppliers: {
    search: (params) => ipcRenderer.invoke('suppliers:search', params),
    save: (data) => ipcRenderer.invoke('suppliers:save', data),
    delete: (id) => ipcRenderer.invoke('suppliers:delete', id),
  },

  // Purchase Invoices
  purchases: {
    invoices: (params) => ipcRenderer.invoke('purchases:invoices', params),
    options: (branchId) => ipcRenderer.invoke('purchases:options', branchId),
    createInvoice: (data) => ipcRenderer.invoke('purchases:create-invoice', data),
  },

  // Accounting
  accounts: {
    list: (params) => ipcRenderer.invoke('accounts:list', params),
    save: (data) => ipcRenderer.invoke('accounts:save', data),
    delete: (id) => ipcRenderer.invoke('accounts:delete', id),
    catalogs: () => ipcRenderer.invoke('accounts:catalogs'),
    createCatalog: (data) => ipcRenderer.invoke('accounts:create-catalog', data),
    applyCatalog: (id) => ipcRenderer.invoke('accounts:apply-catalog', id),
  },

  // Inventory Categories
  categories: {
    list: (branchId) => ipcRenderer.invoke('categories:list', branchId),
    save: (data) => ipcRenderer.invoke('categories:save', data),
    delete: (id) => ipcRenderer.invoke('categories:delete', id),
  },

  taxes: {
    list: (params) => ipcRenderer.invoke('taxes:list', params),
    update: (data) => ipcRenderer.invoke('taxes:update', data),
  },

  // HR
  hr: {
    employees: (params) => ipcRenderer.invoke('hr:employees-search', params),
    employeeOptions: (branchId) => ipcRenderer.invoke('hr:employees-options', branchId),
    employeeSave: (data) => ipcRenderer.invoke('hr:employee-save', data),
    employeeDelete: (id) => ipcRenderer.invoke('hr:employee-delete', id),
    attendance: (params) => ipcRenderer.invoke('hr:attendance-search', params),
    attendanceSummary: (params) => ipcRenderer.invoke('hr:attendance-summary', params),
    attendanceUpsert: (data) => ipcRenderer.invoke('hr:attendance-upsert', data),
    leaves: (params) => ipcRenderer.invoke('hr:leaves-search', params),
    leaveSave: (data) => ipcRenderer.invoke('hr:leave-save', data),
    payrolls: (params) => ipcRenderer.invoke('hr:payrolls-search', params),
    payrollGenerate: (data) => ipcRenderer.invoke('hr:payroll-generate', data),
  },

  // Hardware
  hardware: {
    printReceipt: (params) => ipcRenderer.invoke('hardware:print-receipt', params),
    openCashDrawer: () => ipcRenderer.invoke('hardware:open-cashdrawer'),
  },
});
