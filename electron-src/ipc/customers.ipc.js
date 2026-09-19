const customerService = require('../services/customer.service');

function registerCustomersIPC(ipcMain) {
  ipcMain.handle('customers:search', async (event, params) => {
    try { return { success: true, data: customerService.searchCustomers(params || {}) }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('customers:save', async (event, data) => {
    try { return { success: true, data: customerService.saveCustomer(data), message: 'تم حفظ بيانات العميل بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('customers:delete', async (event, id) => {
    const customerId = typeof id === 'object' && id !== null ? id.id : id;
    try { customerService.deleteCustomer(customerId); return { success: true, message: 'تم حذف العميل بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerCustomersIPC;