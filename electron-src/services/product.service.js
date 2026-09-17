const productRepository = require('../repositories/product.repository');

class ProductService {
  searchProducts(params) {
    return productRepository.searchProducts(params);
  }

  listCategories(branchId) {
    return productRepository.listCategories(branchId);
  }

  saveProduct(data) {
    if (!data.name || !data.name.trim()) throw new Error('اسم المنتج مطلوب');
    return productRepository.saveProduct(data);
  }

  deleteProduct(id) {
    if (!id) throw new Error('معرّف المنتج مطلوب');
    return productRepository.softDelete(id);
  }
}

module.exports = new ProductService();