const categoryService = require('../services/category.service');

function registerCategoriesIPC(ipcMain) {
  ipcMain.handle('categories:list', async (event, branchId) => {
    const id = typeof branchId === 'object' && branchId !== null ? branchId.id : branchId;
    try { return { success: true, data: categoryService.listCategories(id || 1) }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('categories:save', async (event, data) => {
    try { return { success: true, data: categoryService.saveCategory(data), message: 'تم حفظ التصنيف بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
  ipcMain.handle('categories:delete', async (event, id) => {
    const categoryId = typeof id === 'object' && id !== null ? id.id : id;
    try { categoryService.deleteCategory(categoryId); return { success: true, message: 'تم حذف التصنيف بنجاح' }; }
    catch (err) { return { success: false, error: err.message }; }
  });
}

module.exports = registerCategoriesIPC;