const productService = require('../services/product.service');

function registerProductsIPC(ipcMain) {
  ipcMain.handle('products:search', async (event, params) => {
    try {
      return { success: true, data: productService.searchProducts(params || {}) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:categories', async (event, branchId) => {
    try {
      return { success: true, data: productService.listCategories(branchId || 1) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:save', async (event, data) => {
    try {
      return { success: true, data: productService.saveProduct(data), message: 'تم حفظ المنتج بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:delete', async (event, id) => {
    try {
      productService.deleteProduct(id);
      return { success: true, message: 'تم حذف المنتج بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerProductsIPC;