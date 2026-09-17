const customerRepository = require('../repositories/customer.repository');

class CustomerService {
  searchCustomers(params) { return customerRepository.searchCustomers(params); }

  saveCustomer(data) {
    if (!data.name || !data.name.trim()) throw new Error('اسم العميل مطلوب');
    return customerRepository.saveCustomer(data);
  }

  deleteCustomer(id) {
    if (!id) throw new Error('معرّف العميل مطلوب');
    return customerRepository.softDelete(id);
  }
}

module.exports = new CustomerService();