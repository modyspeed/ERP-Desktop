const BaseRepository = require('./base.repository');

class CategoryRepository extends BaseRepository {
  constructor() { super('categories'); }
  listCategories(branchId = 1) {
    return this.db.prepare('SELECT c.*, p.name AS parent_name, (SELECT COUNT(*) FROM products p2 WHERE p2.category_id = c.id AND p2.is_deleted = 0) AS products_count FROM categories c LEFT JOIN categories p ON p.id = c.parent_id WHERE c.branch_id = ? AND c.is_deleted = 0 ORDER BY c.name').all(branchId);
  }
  saveCategory({ id, branch_id = 1, name, parent_id = null, created_by = null }) {
    if (!name || !name.trim()) throw new Error('اسم التصنيف مطلوب');
    const data = { branch_id, name: name.trim(), parent_id: parent_id || null, created_by };
    return id ? this.update(id, data) : this.create(data);
  }
}

module.exports = new CategoryRepository();