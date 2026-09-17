const categoryService = require('../services/category.service');

function registerCategoriesIPC(ipcMain) {
  ipcMain.handle('categories:list', async (event, branchId) => {
    try { return { success: true, data: categoryService.listCategories(branchId || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('categories:save', async (event, data) => {
    try { return { success: true, data: categoryService.saveCategory(data), message: 'تم حفظ التصنيف بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('categories:delete', async (event, id) => {
    try { categoryService.deleteCategory(id); return { success: true, message: 'تم حذف التصنيف بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerCategoriesIPC;