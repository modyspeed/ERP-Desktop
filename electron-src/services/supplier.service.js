const supplierRepository = require('../repositories/supplier.repository');

class SupplierService {
  searchSuppliers(params) { return supplierRepository.searchSuppliers(params); }
  saveSupplier(data) {
    if (!data.name || !data.name.trim()) throw new Error('اسم المورد مطلوب');
    return supplierRepository.saveSupplier(data);
  }
  deleteSupplier(id) { if (!id) throw new Error('معرّف المورد مطلوب'); return supplierRepository.softDelete(id); }
}

module.exports = new SupplierService();