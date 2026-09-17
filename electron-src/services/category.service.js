const categoryRepository = require('../repositories/category.repository');

class CategoryService {
  listCategories(branchId) { return categoryRepository.listCategories(branchId); }
  saveCategory(data) { return categoryRepository.saveCategory(data); }
  deleteCategory(id) { if (!id) throw new Error('معرّف التصنيف مطلوب'); return categoryRepository.softDelete(id); }
}

module.exports = new CategoryService();