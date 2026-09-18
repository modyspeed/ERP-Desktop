const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');

class ReportRepository extends BaseRepository {
  constructor() {
    super('sales_invoices');
  }

  profitLoss({ start_date, end_date, branch_id = 1 } = {}) {
    let sql = `
      SELECT
        COALESCE(SUM(si.subtotal), 0) as gross_sales,
        COALESCE(SUM(si.discount), 0) as total_discount,
        COALESCE(SUM(si.tax_amount), 0) as total_tax,
        COALESCE(SUM(si.total), 0) as total_sales,
        COALESCE(SUM(si.paid_amount), 0) as total_paid,
        COALESCE(SUM(si.remaining_amount), 0) as total_receivable
      FROM sales_invoices si
      WHERE si.is_deleted = 0 AND si.branch_id = ?
    `;
    const params = [branch_id];
    if (start_date) { sql += ' AND si.date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND si.date <= ?'; params.push(end_date); }
    const sales = this.db.prepare(sql).get(...params);

    const expenseSql = `SELECT COALESCE(SUM(jel.debit - jel.credit), 0) as total_expenses FROM journal_entries je LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id WHERE je.is_deleted = 0 AND je.branch_id = ? AND je.reference_type IN ('expense', 'payroll')`;
    const expenseParams = [branch_id];
    if (start_date) { expenseSql += ' AND je.date >= ?'; expenseParams.push(start_date); }
    if (end_date) { expenseSql += ' AND je.date <= ?'; expenseParams.push(end_date); }
    const expenses = this.db.prepare(expenseSql).get(...expenseParams);

    const purchaseSql = `SELECT COALESCE(SUM(pi.subtotal), 0) as total_purchases, COALESCE(SUM(pi.tax_amount), 0) as purchase_tax FROM purchase_invoices pi WHERE pi.is_deleted = 0 AND pi.branch_id = ?`;
    const purchaseParams = [branch_id];
    if (start_date) { purchaseSql += ' AND pi.date >= ?'; purchaseParams.push(start_date); }
    if (end_date) { purchaseSql += ' AND pi.date <= ?'; purchaseParams.push(end_date); }
    const purchases = this.db.prepare(purchaseSql).get(...purchaseParams);

    const grossProfit = sales.total_sales - purchases.total_purchases;
    const netProfit = grossProfit - expenses.total_expenses;

    return {
      period: { start_date, end_date },
      sales: {
        gross_sales: sales.gross_sales,
        discount: sales.total_discount,
        tax: sales.total_tax,
        total: sales.total_sales,
        paid: sales.total_paid,
        receivable: sales.total_receivable,
      },
      purchases: {
        total: purchases.total_purchases,
        tax: purchases.purchase_tax,
      },
      gross_profit: grossProfit,
      expenses: expenses.total_expenses,
      net_profit: netProfit,
    };
  }

  inventoryMovement({ product_id, start_date, end_date, branch_id = 1, page = 1, limit = 50 } = {}) {
    let sql = `
      SELECT sm.*, p.name AS product_name, p.sku, w.name AS warehouse_name
      FROM stock_movements sm
      LEFT JOIN products p ON p.id = sm.product_id
      LEFT JOIN warehouses w ON w.id = sm.warehouse_id
      WHERE 1=1
    `;
    const params = [];
    if (branch_id) { sql += ' AND sm.branch_id = ?'; params.push(branch_id); }
    if (product_id) { sql += ' AND sm.product_id = ?'; params.push(product_id); }
    if (start_date) { sql += ' AND sm.created_at >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND sm.created_at <= ?'; params.push(end_date); }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY sm.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  taxReport({ start_date, end_date, branch_id = 1 } = {}) {
    const settings = this.db.prepare('SELECT tax_country_code, sales_tax_percentage, purchase_tax_percentage FROM company_settings LIMIT 1').get() || {};

    let salesTaxSql = `SELECT COALESCE(SUM(si.tax_amount), 0) as tax_collected, COUNT(*) as invoice_count FROM sales_invoices si WHERE si.is_deleted = 0 AND si.branch_id = ?`;
    const params = [branch_id];
    if (start_date) { salesTaxSql += ' AND si.date >= ?'; params.push(start_date); }
    if (end_date) { salesTaxSql += ' AND si.date <= ?'; params.push(end_date); }
    const sales = this.db.prepare(salesTaxSql).get(...params);

    let purchaseTaxSql = `SELECT COALESCE(SUM(pi.tax_amount), 0) as tax_paid, COUNT(*) as invoice_count FROM purchase_invoices pi WHERE pi.is_deleted = 0 AND pi.branch_id = ?`;
    const purchaseParams = [branch_id];
    if (start_date) { purchaseTaxSql += ' AND pi.date >= ?'; purchaseParams.push(start_date); }
    if (end_date) { purchaseTaxSql += ' AND pi.date <= ?'; purchaseParams.push(end_date); }
    const purchases = this.db.prepare(purchaseTaxSql).get(...purchaseParams);

    return {
      country_code: settings.tax_country_code || 'SA',
      sales_tax_rate: settings.sales_tax_percentage || 15,
      purchase_tax_rate: settings.purchase_tax_percentage || 15,
      tax_collected: sales.tax_collected,
      tax_paid: purchases.tax_paid,
      tax_due: sales.tax_collected - purchases.tax_paid,
      sales_invoices: sales.invoice_count,
      purchase_invoices: purchases.invoice_count,
    };
  }

  salesSummary({ start_date, end_date, branch_id = 1 } = {}) {
    let sql = `SELECT COUNT(*) as invoice_count, COALESCE(SUM(total), 0) as total_sales, COALESCE(SUM(paid_amount), 0) as total_paid, COALESCE(SUM(remaining_amount), 0) as total_receivable FROM sales_invoices WHERE is_deleted = 0 AND branch_id = ?`;
    const params = [branch_id];
    if (start_date) { sql += ' AND date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND date <= ?'; params.push(end_date); }
    return this.db.prepare(sql).get(...params);
  }
}

module.exports = new ReportRepository();
