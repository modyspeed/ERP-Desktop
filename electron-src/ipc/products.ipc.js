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
    const id = typeof branchId === 'object' && branchId !== null ? branchId.id : branchId;
    try {
      return { success: true, data: productService.listCategories(id || 1) };
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
    const productId = typeof id === 'object' && id !== null ? id.id : id;
    try {
      productService.deleteProduct(productId);
      return { success: true, message: 'تم حذف المنتج بنجاح' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerProductsIPC;