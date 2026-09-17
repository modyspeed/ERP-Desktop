const BaseRepository = require('./base.repository');

class CustomerRepository extends BaseRepository {
  constructor() {
    super('customers');
  }

  searchCustomers({ query = '', branch_id = 1, page = 1, limit = 10 } = {}) {
    let sql = `SELECT * FROM customers WHERE is_deleted = 0 AND branch_id = ?`;
    const params = [branch_id];

    if (query.trim()) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR tax_number LIKE ?)';
      const search = `%${query.trim()}%`;
      params.push(search, search, search, search);
    }

    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    return {
      items: this.db.prepare(sql).all(...params),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  saveCustomer({ id, branch_id = 1, ...data }) {
    const customer = {
      ...data,
      branch_id,
      credit_limit: Number(data.credit_limit || 0),
      opening_balance: Number(data.opening_balance || 0),
    };
    return id ? this.update(id, customer) : this.create(customer);
  }
}

module.exports = new CustomerRepository();