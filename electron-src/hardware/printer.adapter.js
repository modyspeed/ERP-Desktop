const { BrowserWindow } = require('electron');
const { getDatabase } = require('../database/db');
const settingRepository = require('../repositories/setting.repository');
const { buildInvoiceDocument, normalizePaperSize, paperWidthMm } = require('../utils/invoice-document');

const MM_TO_PX = 96 / 25.4;

// يكشف نوع الفاتورة من الحقول المتاحة عند الاستدعاء: فواتير الشراء تحمل
// supplier_id بينما فواتير البيع تحمل customer_id.
function detectKind(invoice = {}) {
  return invoice.supplier_id != null || invoice.supplier_name ? 'purchase' : 'sales';
}

function fetchSalesItems(invoiceId) {
  return getDatabase()
    .prepare(
      `SELECT si.qty, si.unit_price, si.discount, si.tax, si.line_total, p.name AS product_name
       FROM sales_invoice_items si
       LEFT JOIN products p ON p.id = si.product_id
       WHERE si.invoice_id = ?
       ORDER BY si.id`,
    )
    .all(invoiceId);
}

function fetchPurchaseItems(invoiceId) {
  return getDatabase()
    .prepare(
      `SELECT pi.qty, pi.unit_cost AS unit_price, pi.line_total, p.name AS product_name
       FROM purchase_invoice_items pi
       LEFT JOIN products p ON p.id = pi.product_id
       WHERE pi.invoice_id = ?
       ORDER BY pi.id`,
    )
    .all(invoiceId);
}

function fetchItems(invoice, kind) {
  if (!invoice || !invoice.id) return [];
  try {
    return kind === 'purchase' ? fetchPurchaseItems(invoice.id) : fetchSalesItems(invoice.id);
  } catch (err) {
    console.error('[PrinterAdapter] failed to load invoice items:', err.message);
    return [];
  }
}

function loadBranch(branch) {
  if (branch && branch.id) return branch;
  try {
    return getDatabase().prepare('SELECT * FROM branches ORDER BY id LIMIT 1').get() || null;
  } catch {
    return null;
  }
}

// فاتورة تجريبية لعرض شكل الورق من شاشة الإعدادات بدون فاتورة حقيقية.
const SAMPLE_INVOICE = {
  id: null,
  invoice_number: 'SAMPLE-001',
  date: new Date().toISOString().slice(0, 10),
  customer_name: 'عميل تجريبي',
  subtotal: 150,
  discount: 0,
  tax_amount: 22.5,
  total: 172.5,
  paid_amount: 50,
  remaining_amount: 122.5,
  payment_status: 'partial',
};

const SAMPLE_ITEMS = [
  { product_name: 'منتج تجريبي 1', qty: 2, unit_price: 50, line_total: 100 },
  { product_name: 'منتج تجريبي 2', qty: 1, unit_price: 50, line_total: 50 },
];

/**
 * يفتح نافذة معاينة بعرض ورقة الفاتورة المحدد ويحمّل المستند بداخلها.
 * @returns {Promise<{window: import('electron').BrowserWindow, document: object}>}
 */
async function openInvoiceWindow({ invoice, items, settings, branch, paperSize, kind }) {
  const size = normalizePaperSize(paperSize);
  const widthMm = paperWidthMm(size);
  const doc = buildInvoiceDocument({ invoice, items, settings, branch, paperSize: size, kind });

  const windowWidth = size === 'a4' ? 794 : Math.round(widthMm * MM_TO_PX);
  const windowHeight = size === 'a4' ? 1123 : 640;

  const win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    title: doc.title,
    show: false,
    parent: BrowserWindow.getFocusedWindow() || undefined,
    webPreferences: {
      offscreen: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(doc.html)}`);

  return { window: win, document: doc };
}

class PrinterAdapter {
  constructor() {
    this.type = 'generic_esc_pos';
  }

  async printReceipt({ invoice, settings, branch, paper_size, kind } = {}) {
    const effectiveSettings = settings || settingRepository.getSettings();
    const resolvedSize = normalizePaperSize(paper_size || effectiveSettings.invoice_paper_size);
    const resolvedKind = kind || detectKind(invoice);
    const items = fetchItems(invoice, resolvedKind);

    const { window: win, document: doc } = await openInvoiceWindow({
      invoice: invoice || SAMPLE_INVOICE,
      items: items.length ? items : invoice ? [] : SAMPLE_ITEMS,
      settings: effectiveSettings,
      branch: loadBranch(branch),
      paperSize: resolvedSize,
      kind: resolvedKind,
    });

    win.show();

    return new Promise((resolve) => {
      win.webContents.print(
        {
          silent: false,
          printBackground: true,
          margins: { marginType: 'none' },
          pageSize: doc.size === 'a4' ? 'A4' : { width: doc.widthMm * 1000, height: doc.widthMm * 1000 },
        },
        (success, failureReason) => {
          if (success) {
            win.destroy();
          } else if (failureReason && failureReason !== 'cancelled') {
            console.error('[PrinterAdapter] print failed:', failureReason);
            win.destroy();
          }
          resolve({
            success: !!success,
            paper: doc.size,
            widthMm: doc.widthMm,
            message: success ? 'تم إرسال الفاتورة للطباعة بنجاح' : 'تم إلغاء الطباعة',
            timestamp: new Date().toISOString(),
          });
        },
      );
    });
  }

  // معاينة بدون إرسال لامر الطباعة، تُستخدم من شاشة الإعدادات لاختبار حجم الورق.
  async previewReceipt({ paper_size, settings, branch, kind } = {}) {
    const effectiveSettings = settings || settingRepository.getSettings();
    const resolvedSize = normalizePaperSize(paper_size || effectiveSettings.invoice_paper_size);
    const resolvedKind = kind || 'sales';

    const { window: win, document: doc } = await openInvoiceWindow({
      invoice: SAMPLE_INVOICE,
      items: SAMPLE_ITEMS,
      settings: effectiveSettings,
      branch: loadBranch(branch),
      paperSize: resolvedSize,
      kind: resolvedKind,
    });

    win.show();
    win.focus();

    return {
      success: true,
      paper: doc.size,
      widthMm: doc.widthMm,
      message: 'تم فتح معاينة الفاتورة',
      timestamp: new Date().toISOString(),
    };
  }

  async printReport({ title, content }) {
    console.log('[Hardware PrinterAdapter] Printing report:', title);
    return {
      success: true,
      message: 'تم إرسال التقرير للطباعة بنجاح',
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new PrinterAdapter();
module.exports.openInvoiceWindow = openInvoiceWindow;
