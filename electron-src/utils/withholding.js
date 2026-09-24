/**
 * Egyptian Withholding Tax (ضريبة الخصم والإضافة تحت حساب الضريبة).
 *
 * The rate is not fixed — it depends on the supplier's activity category, and
 * each category is stored as an independent row in `tax_rates`
 * (applies_to='purchases', is_withholding=1). Suppliers carry their default
 * category in `suppliers.withholding_category` (a tax_code value).
 *
 * Suppliers registered under the alternative "Advance Payments System"
 * (is_advance_payment_exempt = 1) must never have WHT deducted, regardless of
 * their category.
 */

const WITHHOLDING_CATEGORY_CODES = [
  'WHT_SUPPLIES',
  'WHT_CONTRACTING',
  'WHT_GENERAL_SERVICES',
  'WHT_PROFESSIONAL_FEES',
  'WHT_BROKERAGE',
];

const WITHHOLDING_CATEGORY_LABELS = {
  WHT_SUPPLIES: 'توريدات وسلع',
  WHT_CONTRACTING: 'مقاولات',
  WHT_GENERAL_SERVICES: 'خدمات عامة',
  WHT_PROFESSIONAL_FEES: 'مهن حرة / أتعاب مهنية / استشارات',
  WHT_BROKERAGE: 'سمسرة وعمولات وإعلانات',
};

function isAdvancePaymentExempt(supplier) {
  return Boolean(supplier && Number(supplier.is_advance_payment_exempt) === 1);
}

/**
 * Active withholding categories for a country (rate + labels), ordered by rate.
 * Used to populate supplier/invoice dropdowns.
 */
function listWithholdingCategories(db, countryCode) {
  if (!db || !countryCode) return [];
  return db
    .prepare(
      `SELECT id, tax_code, name_ar, name_en, rate_percentage
       FROM tax_rates
       WHERE country_code = ? AND is_withholding = 1 AND is_active = 1
         AND (effective_from IS NULL OR effective_from <= date('now'))
         AND (effective_to IS NULL OR effective_to >= date('now'))
       ORDER BY rate_percentage ASC, tax_code ASC`
    )
    .all(countryCode);
}

/**
 * Resolve the withholding rate that applies to a supplier right now.
 *
 * Returns { rate, taxCode, taxRateId, name } — rate is 0 when the supplier is
 * exempt or has no resolvable category, so callers simply deduct nothing.
 */
function resolveSupplierWithholding(db, { supplier, countryCode, taxCode }) {
  if (isAdvancePaymentExempt(supplier)) {
    return { rate: 0, taxCode: null, taxRateId: null, name: null, exempt: true };
  }
  const code = taxCode || supplier?.withholding_category;
  if (!code || !countryCode) {
    return { rate: 0, taxCode: code || null, taxRateId: null, name: null, exempt: false };
  }
  const row = db
    .prepare(
      `SELECT id, tax_code, name_ar, rate_percentage
       FROM tax_rates
       WHERE country_code = ? AND tax_code = ? AND is_withholding = 1 AND is_active = 1
         AND (effective_from IS NULL OR effective_from <= date('now'))
         AND (effective_to IS NULL OR effective_to >= date('now'))`
    )
    .get(countryCode, code);
  if (!row) {
    return { rate: 0, taxCode: code, taxRateId: null, name: null, exempt: false };
  }
  return {
    rate: Number(row.rate_percentage || 0),
    taxCode: row.tax_code,
    taxRateId: row.id,
    name: row.name_ar,
    exempt: false,
  };
}

module.exports = {
  WITHHOLDING_CATEGORY_CODES,
  WITHHOLDING_CATEGORY_LABELS,
  isAdvancePaymentExempt,
  listWithholdingCategories,
  resolveSupplierWithholding,
};
