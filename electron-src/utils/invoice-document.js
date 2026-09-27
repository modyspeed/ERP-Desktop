// بناء مستند طباعة الفاتورة بتخطيط يعتمد على حجم الورق المختار:
// A4 (تخطيط كامل العرض) / حراري 80مم / حراري 58مم (عرض ثابت ضيق وخط أكبر).

const PAPER_DIMENSIONS = {
  a4: { widthMm: 210, heightMm: 297 },
  thermal_80: { widthMm: 80, heightMm: null },
  thermal_58: { widthMm: 58, heightMm: null },
};

// تُقبل الصيغ المتعددة القادمة من الإعدادات أو من قواعد البيانات القديمة
// ('thermal_80', '80', '80mm', 'thermal 80') وتوحَّد إلى المفتاح الداخلي.
function normalizePaperSize(size) {
  const value = String(size || '').toLowerCase().replace(/[\s_-]/g, '');
  if (value === 'thermal80' || value === '80' || value === '80mm') return 'thermal_80';
  if (value === 'thermal58' || value === '58' || value === '58mm') return 'thermal_58';
  return 'a4';
}

function paperWidthMm(size) {
  const key = normalizePaperSize(size);
  return PAPER_DIMENSIONS[key].widthMm;
}

const esc = (value) => String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

const formatMoney = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

function taxLines(invoice) {
  try {
    const details = typeof invoice.tax_details === 'string' ? JSON.parse(invoice.tax_details) : invoice.tax_details;
    if (Array.isArray(details)) {
      return details.map((d) => ({ name: d.name || d.short_name || 'ضريبة', amount: Number(d.amount || 0) }));
    }
  } catch { /* ignore malformed JSON, fall back below */ }
  const tax = Number(invoice.tax_amount || 0);
  return tax ? [{ name: 'ضريبة القيمة المضافة', amount: tax }] : [];
}

function buildItemsRows(items, paperSize) {
  const columnCount = paperSize === 'thermal_58' ? 3 : 4;
  if (!items || !items.length) {
    return `<tr><td colspan="${columnCount}" style="text-align:center;color:#888;padding:10px 0;">لا توجد أصناف</td></tr>`;
  }
  // على الورق الحراري الضيق جداً (58مم) نخفي عمود السعر الفردي لتوفير المساحة،
  // ونترك الأسماء تطوي الأسطر بدل فرض nowrap الذي يسبب تجاوز العرض.
  const showUnitPrice = paperSize !== 'thermal_58';
  const pad = showUnitPrice ? '6px 4px' : '6px 1px';
  return items
    .map((item) => {
      const name = esc(item.product_name || item.name || 'صنف');
      const qty = Number(item.qty || 0);
      const unit = Number(item.unit_price ?? item.unit_cost ?? 0);
      const total = Number(item.line_total || qty * unit);
      if (showUnitPrice) {
        return `<tr>
          <td style="padding:${pad};border-bottom:1px dashed #bbb;overflow-wrap:anywhere;">${name}</td>
          <td style="padding:${pad};text-align:center;border-bottom:1px dashed #bbb;">${qty}</td>
          <td style="padding:${pad};text-align:end;border-bottom:1px dashed #bbb;">${formatMoney(unit)}</td>
          <td style="padding:${pad};text-align:end;border-bottom:1px dashed #bbb;">${formatMoney(total)}</td>
        </tr>`;
      }
      return `<tr>
        <td style="padding:${pad};border-bottom:1px dashed #bbb;overflow-wrap:anywhere;">${name}</td>
        <td style="padding:${pad};text-align:center;border-bottom:1px dashed #bbb;">x${qty}</td>
        <td style="padding:${pad};text-align:end;border-bottom:1px dashed #bbb;">${formatMoney(total)}</td>
      </tr>`;
    })
    .join('');
}

/**
 * Builds a full HTML document for printing an invoice.
 *
 * @param {object} params
 * @param {object} params.invoice - sales or purchase invoice row
 * @param {Array}  params.items   - invoice line items (with product_name)
 * @param {object} params.settings - company_settings row
 * @param {object} [params.branch]  - branch row
 * @param {string} [params.paperSize] - 'a4' | 'thermal_80' | 'thermal_58'
 * @param {('sales'|'purchase')} [params.kind] - invoice kind for labels
 */
function buildInvoiceDocument({ invoice = {}, items, settings = {}, branch, paperSize = 'a4', kind = 'sales' }) {
  const size = normalizePaperSize(paperSize);
  const dims = PAPER_DIMENSIONS[size];
  const isThermal = size !== 'a4';
  const company = settings || {};

  const isPurchase = kind === 'purchase';
  const docTitle = isPurchase ? `فاتورة شراء ${invoice.invoice_number || ''}` : `فاتورة بيع ${invoice.invoice_number || ''}`;
  const partyLabel = isPurchase ? 'المورد' : 'العميل';
  const partyName = esc(invoice.customer_name || invoice.supplier_name || (isPurchase ? '—' : 'عميل نقدي'));

  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const taxes = taxLines(invoice);
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.paid_amount || 0);
  const remaining = Number(invoice.remaining_amount || 0);

  // قيم الأحجام أرقام بلا وحدة حتى تُضاف px مرة واحدة عند الاستخدام.
  const fontSize = size === 'thermal_58' ? 11 : isThermal ? 12 : 14;
  const smallFont = Math.max(9, fontSize - 1);
  const baseFont = fontSize + 1; // اسم الشركة أكبر قليلاً

  const thStyle = (align, pad) => `text-align:${align};padding:${pad};border-bottom:2px solid #333;white-space:nowrap;`;
  const itemsHead = isThermal
    ? size === 'thermal_58'
      ? `<tr><th style="${thStyle('start', '4px 2px')}">الصنف</th><th style="${thStyle('center', '4px 2px')}">كمية</th><th style="${thStyle('end', '4px 2px')}">الإجمالي</th></tr>`
      : `<tr><th style="${thStyle('start', '4px')}">الصنف</th><th style="${thStyle('center', '4px')}">الكمية</th><th style="${thStyle('end', '4px')}">السعر</th><th style="${thStyle('end', '4px')}">الإجمالي</th></tr>`
    : `<tr><th style="${thStyle('start', '8px')}">الصنف</th><th style="${thStyle('center', '8px')}">الكمية</th><th style="${thStyle('end', '8px')}">سعر الوحدة</th><th style="${thStyle('end', '8px')}">الإجمالي</th></tr>`;

  // سطر الإجمالي: الاسم يلتقط المساحة المتبقية والمبلغ لا ينقسم.
  const totalRow = (label, value, extra = '') =>
    `<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;${extra}"><span>${label}</span><strong class="nowrap">${value}</strong></div>`;

  const taxRows = taxes
    .map((t) => totalRow(esc(t.name), formatMoney(t.amount)))
    .join('');

  const totalsBlock = `
    <div style="margin-top:${isThermal ? 6 : 14}px;padding-top:${isThermal ? 6 : 10}px;border-top:${isThermal ? '1px dashed #555' : '2px solid #333'};">
      ${discount ? totalRow('الخصم', formatMoney(discount)) : ''}
      ${totalRow('الإجمالي الفرعي', formatMoney(subtotal))}
      ${taxRows}
      <div style="display:flex;justify-content:space-between;gap:8px;padding:${isThermal ? 5 : 8}px 0;margin-top:4px;border-top:1px solid #999;font-size:${baseFont}px;"><strong>الإجمالي</strong><strong class="nowrap">${formatMoney(total)}</strong></div>
      ${paid > 0 ? totalRow('المدفوع', formatMoney(paid)) : ''}
      ${remaining > 0 ? totalRow('المتبقي', formatMoney(remaining)) : ''}
    </div>`;

  const footerNote = company.tax_number ? `<div style="margin-top:${isThermal ? 6 : 16}px;text-align:center;font-size:${smallFont}px;color:#555;">الرقم الضريبي: ${esc(company.tax_number)}</div>` : '';
  const thanks = `<div style="margin-top:${isThermal ? 8 : 18}px;text-align:center;font-size:${fontSize}px;font-weight:700;">شكراً لكم — نتمنى لكم يوماً سعيداً</div>`;

  const logoHtml = company.logo_path
    ? `<img src="${esc(company.logo_path)}" alt="شعار" style="max-width:${isThermal ? '40mm' : '180px'};max-height:${isThermal ? '16mm' : '70px'};object-fit:contain;" />`
    : '';

  // على الورق الحراري تُكدَّس معلومات الترويسة فوق بعضها بدل وضعها جنباً إلى
  // جنب، لأن العرض الضيق يسبب التفاف الرقم والتاريخ في منتصف القيمة.
  const companyInfo = `
      <div style="font-size:${baseFont + 2}px;font-weight:800;line-height:1.3;">${esc(company.company_name || 'مؤسستي التجارية')}</div>
      ${branch ? `<div style="font-size:${fontSize}px;color:#444;margin-top:2px;">فرع: ${esc(branch.name || '')}</div>` : ''}
      ${company.address ? `<div style="font-size:${smallFont}px;color:#555;margin-top:2px;">${esc(company.address)}</div>` : ''}
      ${company.phone ? `<div style="font-size:${smallFont}px;color:#555;">هاتف: ${esc(company.phone)}</div>` : ''}`;

  const invoiceMeta = `
        <div style="font-weight:800;font-size:${baseFont}px;">${isPurchase ? 'فاتورة شراء' : 'فاتورة ضريبية'}</div>
        <div style="margin-top:2px;" class="nowrap">رقم: <strong>${esc(invoice.invoice_number || '')}</strong></div>
        <div class="nowrap">التاريخ: ${formatDate(invoice.date)}</div>`;

  const headerBlock = isThermal
    ? `
    <div style="text-align:center;">${companyInfo}</div>
    <div style="text-align:start;font-size:${fontSize}px;margin-top:6px;">${invoiceMeta}</div>
    ${logoHtml ? `<div style="margin-top:4px;text-align:center;">${logoHtml}</div>` : ''}`
    : `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
      <div>${companyInfo}
      </div>
      <div style="text-align:end;font-size:${fontSize}px;min-width:220px;">${invoiceMeta}
      </div>
    </div>
    ${logoHtml ? `<div style="margin-top:8px;">${logoHtml}</div>` : ''}`;

  const partyBlock = `
    <div style="margin-top:${isThermal ? 6 : 14}px;padding:${isThermal ? '4px 0' : '8px 10px'};border-top:1px solid #ccc;border-bottom:1px solid #ccc;font-size:${fontSize}px;">
      ${partyLabel}: <strong>${partyName}</strong>
    </div>`;

  const itemsBlock = `
    <table style="width:100%;border-collapse:collapse;font-size:${fontSize}px;table-layout:fixed;">
      <colgroup>${size === 'thermal_58' ? '<col style="width:56%"><col style="width:14%"><col style="width:30%">' : isThermal ? '<col style="width:40%"><col style="width:13%"><col style="width:20%"><col style="width:27%">' : ''}</colgroup>
      <thead>${itemsHead}</thead>
      <tbody>${buildItemsRows(items, size)}</tbody>
    </table>`;

  // A4: صفحة كاملة بهوامش وتنسيق تقريري. الحراري: عرض ثابت بدون هوامش تذكر.
  const pageStyle = isThermal
    ? `@page { size: ${dims.widthMm}mm auto; margin: 2mm; }`
    : `@page { size: A4; margin: 14mm; }`;

  const bodyWidth = isThermal ? `${dims.widthMm}mm` : 'auto';
  const bodyPadding = isThermal ? '0' : '0';

  return {
    size,
    widthMm: dims.widthMm,
    title: docTitle,
    html: `<!DOCTYPE html>
<html dir="rtl" lang="ar" style="direction:rtl;">
<head>
<meta charset="utf-8">
<title>${esc(docTitle)}</title>
<style>
  ${pageStyle}
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  /* التواريخ والأرقام لا تنقسم في منتصف القيمة، وأسماء الأصناف تلتف عند الحاجة فقط */
  .nowrap { white-space: nowrap; }
  table { max-width: 100%; }
  body {
    width: ${bodyWidth};
    max-width: 100%;
    margin: 0 auto;
    padding: ${bodyPadding};
    font-family: "Cairo", "Tahoma", "Segoe UI", Arial, sans-serif;
    color: #000;
    background: #fff;
    font-size: ${fontSize}px;
    line-height: 1.45;
  }
  @media screen {
    body { background: #f2f2f2; padding: 8px; }
  }
</style>
</head>
<body>
  ${headerBlock}
  ${partyBlock}
  ${itemsBlock}
  ${totalsBlock}
  ${footerNote}
  ${thanks}
</body>
</html>`,
  };
}

module.exports = { buildInvoiceDocument, normalizePaperSize, paperWidthMm };
