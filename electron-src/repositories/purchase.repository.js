const BaseRepository = require('./base.repository');
const { getDatabase } = require('../database/db');
const { generateDocumentNumber } = require('../utils/numbering');
const { calculateTaxes } = require('../utils/tax');
const { resolveAccount, ensureAccount, createJournalEntry } = require('../utils/journal');
const { resolveSupplierWithholding, listWithholdingCategories } = require('../utils/withholding');
const auditRepository = require('./audit.repository');

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

class PurchaseRepository extends BaseRepository {
  constructor() { super('purchase_invoices'); }

  listInvoices({ branch_id = 1, query = '', page = 1, limit = 10 } = {}) {
    let sql = `SELECT pi.*, s.name AS supplier_name, s.withholding_category, s.is_advance_payment_exempt FROM purchase_invoices pi LEFT JOIN suppliers s ON s.id = pi.supplier_id WHERE pi.is_deleted = 0 AND pi.branch_id = ?`;
    const params = [branch_id];
    if (query.trim()) { sql += ' AND (pi.invoice_number LIKE ? OR s.name LIKE ?)'; const search = `%${query.trim()}%`; params.push(search, search); }
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`).get(...params).total;
    sql += ' ORDER BY pi.id DESC LIMIT ? OFFSET ?'; params.push(limit, (page - 1) * limit);
    return { items: this.db.prepare(sql).all(...params), total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  getFormOptions(branchId = 1) {
    const settings = this.db.prepare('SELECT tax_country_code, country_code FROM company_settings LIMIT 1').get() || {};
    const countryCode = settings.tax_country_code || settings.country_code || 'SA';
    return {
      suppliers: this.db.prepare('SELECT id, name, withholding_category, is_advance_payment_exempt FROM suppliers WHERE branch_id = ? AND is_deleted = 0 ORDER BY name').all(branchId),
      products: this.db.prepare('SELECT id, name, cost_price FROM products WHERE branch_id = ? AND is_deleted = 0 AND is_active = 1 ORDER BY name').all(branchId),
      warehouses: this.db.prepare('SELECT id, name FROM warehouses WHERE branch_id = ? AND is_deleted = 0 ORDER BY id').all(branchId),
      withholdingCategories: listWithholdingCategories(this.db, countryCode),
    };
  }

  createInvoice({ branch_id = 1, supplier_id, warehouse_id, items, paid_amount = 0, tax_rule_ids = [], tax_overrides = [], created_by }) {
    const db = getDatabase();
    if (!supplier_id || !warehouse_id || !items?.length) throw new Error('المورد والمستودع والأصناف مطلوبة');
    const settings = db.prepare('SELECT invoice_prefix_purchase, tax_enabled, tax_percentage, tax_country_code, country_code FROM company_settings LIMIT 1').get() || {};
    const countryCode = settings.tax_country_code || settings.country_code || 'SA';
    const taxRate = settings.tax_enabled ? Number(settings.purchase_tax_percentage ?? settings.tax_percentage ?? 0) : 0;
    const productQuery = db.prepare('SELECT id, name, cost_price FROM products WHERE id = ? AND branch_id = ? AND is_deleted = 0');
    const normalizedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const quantity = Number(item.qty);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('كميات الأصناف يجب أن تكون أكبر من صفر');
      const product = productQuery.get(item.product_id, branch_id);
      if (!product) throw new Error('أحد المنتجات غير موجود');
      const unitCost = Number(item.unit_cost ?? product.cost_price ?? 0);
      const lineTotal = quantity * unitCost;
      subtotal += lineTotal;
      normalizedItems.push({ product, quantity, unitCost, lineTotal });
    }
    const taxSummary = settings.tax_enabled ? calculateTaxes(db, { countryCode, transactionType: 'purchase', subtotal, fallbackRate: taxRate, ruleIds: tax_rule_ids.map(Number).filter(Boolean), taxOverrides: tax_overrides }) : { details: [], totalTax: 0 };
    const taxAmount = taxSummary.totalTax;
    const total = subtotal + taxAmount;
    const paid = Math.max(0, Number(paid_amount || 0));
    if (paid > total) throw new Error('المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي');
    const remaining = total - paid;
    const paymentStatus = remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    const number = generateDocumentNumber('purchase_invoices', 'invoice_number', settings.invoice_prefix_purchase || 'PO-');

    // ضريبة الخصم والإضافة تُحدد تلقائياً من تصنيف المورد (أو تُلغى لو مسجل في
    // نظام الدفعات المقدمة). تُسجل النسبة على الفاتورة وتُخصم فعلياً عند السداد.
    const supplier = db.prepare('SELECT id, name, withholding_category, is_advance_payment_exempt FROM suppliers WHERE id = ? AND is_deleted = 0').get(supplier_id);
    const withholding = resolveSupplierWithholding(db, { supplier, countryCode });
    const taxDetails = [...taxSummary.details];
    if (withholding.rate > 0) {
      taxDetails.push({ name: withholding.name, short_name: 'WHT', rate: withholding.rate, amount: round2(total * (withholding.rate / 100)), calculation_method: 'withholding', tax_code: withholding.taxCode, deducted_at_payment: true });
    }

    return db.transaction(() => {
      const invoice = db.prepare('INSERT INTO purchase_invoices (branch_id, invoice_number, supplier_id, warehouse_id, date, subtotal, tax_amount, tax_details, total, paid_amount, remaining_amount, payment_status, withholding_tax_code, withholding_rate, created_by) VALUES (?, ?, ?, ?, date(\'now\'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(branch_id, number, supplier_id, warehouse_id, subtotal, taxAmount, JSON.stringify(taxDetails), total, paid, remaining, paymentStatus, withholding.taxCode, withholding.rate, created_by || null);
      const insertItem = db.prepare('INSERT INTO purchase_invoice_items (invoice_id, product_id, qty, unit_cost, line_total) VALUES (?, ?, ?, ?, ?)');
      const addStock = db.prepare('INSERT INTO stock_levels (product_id, warehouse_id, quantity) VALUES (?, ?, ?) ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = CURRENT_TIMESTAMP');
      const insertMovement = db.prepare("INSERT INTO stock_movements (branch_id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes, created_by) VALUES (?, ?, ?, 'in', ?, 'purchase_invoice', ?, ?, ?)");
      for (const item of normalizedItems) {
        insertItem.run(invoice.lastInsertRowid, item.product.id, item.quantity, item.unitCost, item.lineTotal);
        addStock.run(item.product.id, warehouse_id, item.quantity);
        insertMovement.run(branch_id, item.product.id, warehouse_id, item.quantity, invoice.lastInsertRowid, `شراء ${number}`, created_by || null);
      }
      if (remaining > 0) db.prepare('UPDATE suppliers SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(remaining, supplier_id);
      return db.prepare('SELECT * FROM purchase_invoices WHERE id = ?').get(invoice.lastInsertRowid);
    })();
  }

  // سداد فاتورة شراء مع خصم ضريبة الخصم والإضافة تحت حساب الضريبة:
  // المبلغ الإجمالي − قيمة WHT المحسوبة = الصافي المستحق فعلياً للمورد.
  // قيد محاسبي: مدين الموردين / دائن الصندوق (أو البنك) + دائن حساب الالتزام
  // "ضريبة الخصم والإضافة المستحقة" (يُنشأ تلقائياً لو غير موجود في الدليل).
  collectPayment({ invoice_id, amount, payment_method = 'cash', created_by }) {
    const db = getDatabase();
    if (!invoice_id) throw new Error('معرّف الفاتورة مطلوب');

    const invoice = db
      .prepare(`SELECT pi.*, s.withholding_category, s.is_advance_payment_exempt FROM purchase_invoices pi LEFT JOIN suppliers s ON s.id = pi.supplier_id WHERE pi.id = ? AND pi.is_deleted = 0`)
      .get(invoice_id);
    if (!invoice) throw new Error('الفاتورة غير موجودة');

    const remaining = round2(Number(invoice.remaining_amount || 0));
    if (remaining <= 0) throw new Error('الفاتورة مسددة بالكامل');

    const settings = db.prepare('SELECT tax_country_code, country_code FROM company_settings LIMIT 1').get() || {};
    const countryCode = settings.tax_country_code || settings.country_code || 'SA';
    // النسبة المحفوظة على الفاتورة لها الأولوية، وإلا فتصنيف المورد الحالي.
    // المورد المسجل في نظام الدفعات المقدمة لا يُخصم منه إطلاقاً مهما كان تصنيفه.
    const withholding = resolveSupplierWithholding(db, { supplier: invoice, countryCode, taxCode: invoice.withholding_tax_code });
    const rate = withholding.rate;

    let cash = Number(amount || 0);
    if (!Number.isFinite(cash) || cash <= 0) throw new Error('مبلغ السداد يجب أن يكون أكبر من صفر');

    const netPayable = rate > 0 ? round2(remaining * (1 - rate / 100)) : round2(remaining);
    if (cash > netPayable + 0.01) throw new Error(`لا يمكن سداد أكثر من الصافي المستحق بعد ضريبة الخصم والإضافة (${netPayable.toFixed(2)})`);
    if (cash > netPayable) cash = netPayable;

    // إجمالي ما تمت تسويته من ذمة المورد = النقد المدفوع + الضريبة المخصومة منه.
    let gross;
    let withheld;
    if (rate > 0) {
      gross = round2(cash / (1 - rate / 100));
      if (gross > remaining) { gross = round2(remaining); cash = round2(remaining * (1 - rate / 100)); }
      withheld = round2(gross - cash);
    } else {
      gross = round2(cash);
      withheld = 0;
    }
    if (gross <= 0) throw new Error('مبلغ السداد غير صالح');

    const method = ['cash', 'card'].includes(payment_method) ? payment_method : 'cash';

    return db.transaction(() => {
      const newPaid = round2(Number(invoice.paid_amount || 0) + cash);
      const newRemaining = round2(Math.max(0, remaining - gross));
      const newWithheld = round2(Number(invoice.withholding_amount || 0) + withheld);
      const paymentStatus = newRemaining <= 0 ? 'paid' : 'partial';

      db.prepare('UPDATE purchase_invoices SET paid_amount = ?, remaining_amount = ?, withholding_amount = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newPaid, newRemaining, newWithheld, paymentStatus, invoice.id);

      db.prepare('UPDATE suppliers SET current_balance = MAX(0, current_balance - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(gross, invoice.supplier_id);

      const journalLines = [];
      const settlementAccount = method === 'card'
        ? resolveAccount(db, '1120', 'asset', 'بنك')
        : resolveAccount(db, '1110', 'asset', 'صندوق');
      const payableAccount = resolveAccount(db, '2110', 'liability', 'الموردون');
      const whtAccount = withheld > 0
        ? ensureAccount(db, '2230', 'ضريبة الخصم والإضافة المستحقة', 'liability', '2200')
        : null;

      if (payableAccount) journalLines.push({ account_id: payableAccount, debit: gross, credit: 0 });
      if (settlementAccount) journalLines.push({ account_id: settlementAccount, debit: 0, credit: cash });
      if (whtAccount) journalLines.push({ account_id: whtAccount, debit: 0, credit: withheld });

      const journalEntry = createJournalEntry(db, {
        branch_id: invoice.branch_id,
        description: `سداد فاتورة شراء ${invoice.invoice_number}${withheld > 0 ? ` — خصم ضريبة الخصم والإضافة ${withheld.toFixed(2)} (${rate}%)` : ''}`,
        reference_type: 'purchase_invoice',
        reference_id: invoice.id,
        lines: journalLines,
        created_by,
      });

      const updated = db.prepare('SELECT * FROM purchase_invoices WHERE id = ?').get(invoice.id);
      auditRepository.log({
        userId: created_by || null,
        module: 'purchases',
        action: 'collect_payment',
        recordId: invoice.id,
        oldValue: invoice,
        newValue: updated,
      });

      return {
        invoice: updated,
        journal_entry: journalEntry,
        gross_settled: gross,
        cash_paid: cash,
        withholding_amount: withheld,
        withholding_rate: rate,
        withholding_name: withholding.name,
        exempt: withholding.exempt,
      };
    })();
  }
}

module.exports = new PurchaseRepository();
