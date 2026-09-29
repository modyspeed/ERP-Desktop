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

  // ميزان المراجعة: مجموع حركة كل حساب (مدين/دائن) خلال فترة محددة.
  // القيد المحاسبي الواحد متوازن بطبيعته، لذا يجب أن يتساوى إجمالي
  // المدين مع إجمالي الدائن دائمًا؛ أي اختلاف يعني خطأ في البيانات.
  trialBalance({ start_date, end_date, branch_id = 1 } = {}) {
    let sql = `
      SELECT
        a.id,
        a.code,
        a.name,
        a.account_type,
        a.parent_id,
        COALESCE(SUM(jel.debit), 0) AS total_debit,
        COALESCE(SUM(jel.credit), 0) AS total_credit
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_deleted = 0
      WHERE a.is_deleted = 0
    `;
    const params = [];
    if (branch_id) { sql += ' AND COALESCE(je.branch_id, ?) = ?'; params.push(branch_id, branch_id); }
    if (start_date) { sql += ' AND COALESCE(je.date, ?) >= ?'; params.push(start_date, start_date); }
    if (end_date) { sql += ' AND COALESCE(je.date, ?) <= ?'; params.push(end_date, end_date); }
    sql += ' GROUP BY a.id, a.code, a.name, a.account_type, a.parent_id ORDER BY a.code ASC';

    const accounts = this.db.prepare(sql).all(...params);

    // تجميع القيم على الحسابات الأب بحيث يعكس ميزان المراجعة أرصدة
    // الحسابات الفرعية فقط (التي ليس لها أبناء) وتجميعها على الآباء.
    const childCounts = this.db
      .prepare('SELECT parent_id, COUNT(*) AS children FROM chart_of_accounts WHERE is_deleted = 0 AND parent_id IS NOT NULL GROUP BY parent_id')
      .all();
    const hasChildren = new Set(childCounts.map((row) => row.parent_id));

    const byId = new Map(accounts.map((acc) => [acc.id, { ...acc }]));
    const summaryByType = {};
    const totals = { debit: 0, credit: 0 };

    for (const acc of accounts) {
      const isSummary = hasChildren.has(acc.id);
      const balance = Number(acc.total_debit || 0) - Number(acc.total_credit || 0);
      const row = {
        ...acc,
        is_summary: isSummary,
        balance,
        total_debit: Number(acc.total_debit || 0),
        total_credit: Number(acc.total_credit || 0),
      };
      byId.set(acc.id, row);
      // الحساب الأب الذي تُرحّل عليه قيود مباشرة (مثل 5100 تكلفة البضاعة
      // المباعة) ليس حساب ملخص صرفًا؛ تُحتسب حركته في المجاميع وإلا لن
      // يتوازن ميزان المراجعة وتختفي قيوده من التقارير.
      const hasMovement = row.total_debit > 0 || row.total_credit > 0;
      if (!isSummary || hasMovement) {
        totals.debit += row.total_debit;
        totals.credit += row.total_credit;
        summaryByType[acc.account_type] = summaryByType[acc.account_type] || { debit: 0, credit: 0 };
        summaryByType[acc.account_type].debit += row.total_debit;
        summaryByType[acc.account_type].credit += row.total_credit;
      }
    }

    const diff = Number((totals.debit - totals.credit).toFixed(2));
    return {
      period: { start_date, end_date },
      branch_id,
      accounts: Array.from(byId.values()),
      totals,
      balanced: Math.abs(diff) < 0.01,
      difference: diff,
      summary_by_type: summaryByType,
    };
  }

  // قائمة الدخل: الإيرادات ناقص المصروفات ضمن فترة محددة.
  // رصيد حسابات الإيراد دائن، ورصيد حسابات المصروف مدين.
  incomeStatement({ start_date, end_date, branch_id = 1 } = {}) {
    let sql = `
      SELECT
        a.id,
        a.code,
        a.name,
        a.account_type,
        a.parent_id,
        COALESCE(SUM(jel.debit), 0) AS total_debit,
        COALESCE(SUM(jel.credit), 0) AS total_credit
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_deleted = 0
      WHERE a.is_deleted = 0 AND a.account_type IN ('revenue', 'expense')
    `;
    const params = [];
    if (branch_id) { sql += ' AND COALESCE(je.branch_id, ?) = ?'; params.push(branch_id, branch_id); }
    if (start_date) { sql += ' AND COALESCE(je.date, ?) >= ?'; params.push(start_date, start_date); }
    if (end_date) { sql += ' AND COALESCE(je.date, ?) <= ?'; params.push(end_date, end_date); }
    sql += ' GROUP BY a.id, a.code, a.name, a.account_type, a.parent_id ORDER BY a.account_type ASC, a.code ASC';

    const accounts = this.db.prepare(sql).all(...params);

    const childCounts = this.db
      .prepare("SELECT parent_id, COUNT(*) AS children FROM chart_of_accounts WHERE is_deleted = 0 AND parent_id IS NOT NULL AND account_type IN ('revenue', 'expense') GROUP BY parent_id")
      .all();
    const hasChildren = new Set(childCounts.map((row) => row.parent_id));

    const revenues = [];
    const expenses = [];
    let totalRevenue = 0;
    let totalExpense = 0;

    for (const acc of accounts) {
      const isSummary = hasChildren.has(acc.id);
      const debit = Number(acc.total_debit || 0);
      const credit = Number(acc.total_credit || 0);
      // حساب أب له قيود مباشرة (مثل 5100) يُحتسب رصده في الإجماليات.
      const hasMovement = debit > 0 || credit > 0;
      if (acc.account_type === 'revenue') {
        const amount = credit - debit;
        if (!isSummary || hasMovement) totalRevenue += amount;
        revenues.push({ ...acc, amount, is_summary: isSummary, total_debit: debit, total_credit: credit });
      } else {
        const amount = debit - credit;
        if (!isSummary || hasMovement) totalExpense += amount;
        expenses.push({ ...acc, amount, is_summary: isSummary, total_debit: debit, total_credit: credit });
      }
    }

    const netProfit = Number((totalRevenue - totalExpense).toFixed(2));
    return {
      period: { start_date, end_date },
      branch_id,
      revenues,
      expenses,
      total_revenue: Number(totalRevenue.toFixed(2)),
      total_expense: Number(totalExpense.toFixed(2)),
      net_profit: netProfit,
      is_loss: netProfit < 0,
    };
  }

  // الميزانية العمومية: الأصول = الخصوم + حقوق الملكية في تاريخ محدد (لحظة واحدة).
  // الأصل مدين والخصم من حسابه دائن؛ الخصوم وحقوق الملكية دائنة.
  // أرباح/خسائر الفترة الحالية تُرحّل ضمن حقوق الملكية (حساب أرباح/خسائر العام
  // الحالي) لأن الإيرادات والمصروفات تُغلق نظرياً في نهاية الفترة. بدون هذه
  // الترحيلة لا تتوازن الميزانية افتراضياً.
  balanceSheet({ as_of_date, branch_id = 1 } = {}) {
    let sql = `
      SELECT
        a.id,
        a.code,
        a.name,
        a.account_type,
        a.parent_id,
        COALESCE(SUM(jel.debit), 0) AS total_debit,
        COALESCE(SUM(jel.credit), 0) AS total_credit
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_deleted = 0
      WHERE a.is_deleted = 0 AND a.account_type IN ('asset', 'liability', 'equity')
    `;
    const params = [];
    if (branch_id) { sql += ' AND COALESCE(je.branch_id, ?) = ?'; params.push(branch_id, branch_id); }
    if (as_of_date) { sql += ' AND COALESCE(je.date, ?) <= ?'; params.push(as_of_date, as_of_date); }
    sql += ' GROUP BY a.id, a.code, a.name, a.account_type, a.parent_id ORDER BY a.account_type ASC, a.code ASC';

    const accounts = this.db.prepare(sql).all(...params);

    const childCounts = this.db
      .prepare("SELECT parent_id, COUNT(*) AS children FROM chart_of_accounts WHERE is_deleted = 0 AND parent_id IS NOT NULL AND account_type IN ('asset', 'liability', 'equity') GROUP BY parent_id")
      .all();
    const hasChildren = new Set(childCounts.map((row) => row.parent_id));

    const groups = { asset: [], liability: [], equity: [] };
    const totals = { asset: 0, liability: 0, equity: 0 };

    for (const acc of accounts) {
      const isSummary = hasChildren.has(acc.id);
      const debit = Number(acc.total_debit || 0);
      const credit = Number(acc.total_credit || 0);
      const amount = acc.account_type === 'asset' ? debit - credit : credit - debit;
      groups[acc.account_type].push({ ...acc, amount, is_summary: isSummary, total_debit: debit, total_credit: credit });
      // حساب أب له قيود مباشرة يُحتسب رصده في إجمالي المجموعة.
      const hasMovement = debit > 0 || credit > 0;
      if (!isSummary || hasMovement) totals[acc.account_type] += amount;
    }

    // رحّل صافي ربح/خسارة الفترة الحالية إلى حقوق الملكية. الإيراد دائن
    // والمصروف مدين، فالفرق بينهما يمثل النتيجة التي لم تُرحّل بعد.
    const periodResult = this._periodResult({ as_of_date, branch_id });
    if (Math.abs(periodResult) >= 0.01) {
      const currentResultAccount = accounts.find((acc) => acc.account_type === 'equity' && !hasChildren.has(acc.id) && /العام|الجاري|الحالي|Current/i.test(acc.name))
        || accounts.find((acc) => acc.account_type === 'equity' && !hasChildren.has(acc.id));
      if (currentResultAccount) {
        const existing = groups.equity.find((row) => row.id === currentResultAccount.id);
        if (existing) {
          existing.amount = Number((existing.amount + periodResult).toFixed(2));
        } else {
          groups.equity.push({
            ...currentResultAccount,
            amount: Number(periodResult.toFixed(2)),
            is_summary: false,
            total_debit: periodResult < 0 ? Math.abs(periodResult) : 0,
            total_credit: periodResult > 0 ? periodResult : 0,
          });
        }
        totals.equity = Number((totals.equity + periodResult).toFixed(2));
      }
    }

    const totalAssets = Number(totals.asset.toFixed(2));
    const totalLiabilities = Number(totals.liability.toFixed(2));
    const totalEquity = Number(totals.equity.toFixed(2));
    const totalLiabilitiesAndEquity = Number((totalLiabilities + totalEquity).toFixed(2));
    const diff = Number((totalAssets - totalLiabilitiesAndEquity).toFixed(2));

    return {
      as_of: as_of_date,
      branch_id,
      assets: groups.asset,
      liabilities: groups.liability,
      equity: groups.equity,
      current_period_result: Number(periodResult.toFixed(2)),
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_equity: totalEquity,
      total_liabilities_and_equity: totalLiabilitiesAndEquity,
      balanced: Math.abs(diff) < 0.01,
      difference: diff,
    };
  }

  // صافي نتيجة الفترة (الإيرادات − المصروفات) حتى تاريخ محدد، لترحيلها
  // ضمن حقوق الملكية في الميزانية العمومية.
  _periodResult({ as_of_date, branch_id = 1 } = {}) {
    let sql = `
      SELECT
        a.account_type,
        COALESCE(SUM(jel.debit), 0) AS total_debit,
        COALESCE(SUM(jel.credit), 0) AS total_credit
      FROM chart_of_accounts a
      JOIN journal_entry_lines jel ON jel.account_id = a.id
      JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.is_deleted = 0
      WHERE a.is_deleted = 0 AND a.account_type IN ('revenue', 'expense')
    `;
    const params = [];
    if (branch_id) { sql += ' AND je.branch_id = ?'; params.push(branch_id); }
    if (as_of_date) { sql += ' AND je.date <= ?'; params.push(as_of_date); }
    sql += ' GROUP BY a.account_type';

    const rows = this.db.prepare(sql).all(...params);
    let revenue = 0;
    let expense = 0;
    for (const row of rows) {
      if (row.account_type === 'revenue') revenue = Number(row.total_credit || 0) - Number(row.total_debit || 0);
      else expense = Number(row.total_debit || 0) - Number(row.total_credit || 0);
    }
    return Number((revenue - expense).toFixed(2));
  }
}

module.exports = new ReportRepository();
