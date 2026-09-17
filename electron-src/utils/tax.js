function calculateTaxes(db, { countryCode, transactionType, subtotal, fallbackRate = 0, ruleIds = [], taxOverrides = [] }) {
  let rules;
  if (ruleIds.length) {
    const placeholders = ruleIds.map(() => '?').join(', ');
    rules = db.prepare(`SELECT id, name, short_name, rate, calculation_method, notes FROM tax_rules WHERE id IN (${placeholders}) AND country_code = ? AND is_enabled = 1 ORDER BY id`).all(...ruleIds, countryCode);
  } else {
    rules = db.prepare(`SELECT id, name, short_name, rate, calculation_method, notes FROM tax_rules WHERE country_code = ? AND is_enabled = 1 AND (transaction_type = ? OR transaction_type = 'all') ORDER BY id`).all(countryCode, transactionType);
  }
  const activeRules = rules.length ? rules : [{ name: transactionType === 'purchase' ? 'ضريبة المشتريات' : 'ضريبة المبيعات', short_name: 'VAT', rate: fallbackRate, calculation_method: transactionType === 'purchase' ? 'input' : 'additive', notes: 'نسبة الإعدادات العامة' }];
  const details = activeRules.map((rule) => {
    const override = taxOverrides.find((item) => Number(item.id) === Number(rule.id));
    const rate = override?.rate === undefined ? Number(rule.rate || 0) : Number(override.rate || 0);
    const amount = override?.value === undefined ? Number(subtotal) * (rate / 100) : Number(override.value || 0);
    return { ...rule, rate, amount };
  });
  const additiveAmount = details.filter((rule) => ['additive', 'input'].includes(rule.calculation_method)).reduce((sum, rule) => sum + rule.amount, 0);
  const withholdingAmount = details.filter((rule) => rule.calculation_method === 'withholding').reduce((sum, rule) => sum + rule.amount, 0);
  return { details, additiveAmount, withholdingAmount, totalTax: additiveAmount - withholdingAmount };
}

module.exports = { calculateTaxes };