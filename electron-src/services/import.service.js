const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { getDatabase } = require('../database/db');
const auditRepository = require('../repositories/audit.repository');

const TYPE_FIELDS = {
  products: ['name', 'barcode', 'category', 'unit', 'cost_price', 'sale_price', 'min_stock_alert'],
  customers: ['name', 'phone', 'email', 'address', 'opening_balance'],
};

// أسماء الأعمدة المتوقعة في الملف — مع مرادفات عربية لتجربة أسهل
const HEADER_ALIASES = {
  name: ['name', 'الاسم', 'اسم المنتج', 'اسم العميل', 'الاسم بالكامل', 'المنتج'],
  barcode: ['barcode', 'bar_code', 'barcod', 'الباركود', 'باركود', 'رمز المنتج'],
  category: ['category', 'cat', 'التصنيف', 'تصنيف', 'الفئة', 'قسم'],
  unit: ['unit', 'الوحدة', 'وحدة', 'وحدة القياس', 'الوحدة الأساسية'],
  cost_price: ['cost_price', 'cost', 'costprice', 'سعر التكلفة', 'التكلفة', 'سعر الشراء'],
  sale_price: ['sale_price', 'price', 'saleprice', 'سعر البيع', 'السعر', 'سعر البيع بالقطعة'],
  min_stock_alert: ['min_stock_alert', 'min_stock', 'minstock', 'min_alert', 'حد التنبيه', 'الحد الأدنى', 'تنبيه المخزون'],
  phone: ['phone', 'tel', 'mobile', 'الهاتف', 'رقم الهاتف', 'موبايل', 'الجوال'],
  email: ['email', 'mail', 'البريد', 'البريد الإلكتروني', 'الايميل', 'إيميل'],
  address: ['address', 'addr', 'العنوان', 'عنوان', 'العنوان بالكامل'],
  opening_balance: ['opening_balance', 'balance', 'openingbalance', 'الرصيد الافتتاحي', 'الرصيد', 'رصيد افتتاحي'],
};

const FIELD_LABELS = {
  name: 'الاسم',
  barcode: 'الباركود',
  category: 'التصنيف',
  unit: 'الوحدة',
  cost_price: 'سعر التكلفة',
  sale_price: 'سعر البيع',
  min_stock_alert: 'حد التنبيه',
  phone: 'الهاتف',
  email: 'البريد الإلكتروني',
  address: 'العنوان',
  opening_balance: 'الرصيد الافتتاحي',
};

// تحويل قيمة الخلية إلى رقم، مع تحمل الفواصل العشرية وفواصل الآلاف
function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const str = String(value).trim();
  if (str === '') return null;
  const cleaned = str.replace(/,/g, '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const normalized = cleaned.replace(/[٫٬]/g, '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : NaN;
}

function toString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function canonicalizeHeader(rawHeader, type) {
  const key = String(rawHeader ?? '').trim().toLowerCase();
  if (!key) return null;
  const allowed = TYPE_FIELDS[type] || [];
  for (const field of allowed) {
    const aliases = HEADER_ALIASES[field] || [];
    if (aliases.some((alias) => alias.toLowerCase() === key)) return field;
  }
  return null;
}

function readWorkbook(buffer, ext) {
  if (ext !== 'csv') return XLSX.read(buffer, { type: 'buffer' });
  // ملفات CSV: جرّب UTF-8 أولاً، وإن ظهرت رموز غير مفهومة استخدم ترميز Windows-1256 (العربي)
  const firstTry = XLSX.read(buffer, { type: 'buffer' });
  const sheet = firstTry.Sheets[firstTry.SheetNames[0]];
  const sample = sheet ? JSON.stringify(XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })) : '';
  if (sample.includes('�')) return XLSX.read(buffer, { type: 'buffer', codepage: 1256 });
  return firstTry;
}

class ImportService {
  isValidType(type) {
    return Object.keys(TYPE_FIELDS).includes(type);
  }

  // قراءة الملف وتحويل أول ورقة إلى صفوف مرتبطة بالحقول المعروفة
  parseFile(filePath, type) {
    if (!this.isValidType(type)) throw new Error('نوع الاستيراد غير مدعوم');
    if (!fs.existsSync(filePath)) throw new Error('الملف غير موجود');

    const ext = path.extname(filePath).slice(1).toLowerCase();
    const buffer = fs.readFileSync(filePath);
    const workbook = readWorkbook(buffer, ext);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('الملف لا يحتوي على أي ورقة بيانات');

    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
    if (!matrix.length) return { fileName: path.basename(filePath), fields: [], rows: [] };

    const headerMap = matrix[0].map((header) => canonicalizeHeader(header, type));
    const fields = TYPE_FIELDS[type].filter((field) => headerMap.includes(field));

    const rows = [];
    for (let index = 1; index < matrix.length; index += 1) {
      const rawRow = matrix[index];
      const row = { _rowNumber: index + 1 };
      headerMap.forEach((field, colIndex) => {
        if (field) row[field] = rawRow[colIndex];
      });
      // تجاهل الصفوف الفارغة تمامًا
      const hasData = TYPE_FIELDS[type].some((field) => toString(row[field]) !== '');
      if (hasData) rows.push(row);
    }

    return { fileName: path.basename(filePath), fields, rows };
  }

  // التحقق من الصفوف وتمييز الخاطئ منها (دون أي حفظ)
  preview(type, rows, branchId = 1) {
    const db = getDatabase();
    const context = {
      branchId,
      seenBarcodes: new Set(),
      seenPhones: new Set(),
      existingBarcodes: new Set(
        db
          .prepare('SELECT barcode FROM products WHERE branch_id = ? AND is_deleted = 0 AND barcode IS NOT NULL')
          .all(branchId)
          .map((row) => String(row.barcode).trim())
      ),
    };

    return rows.map((row) => {
      const { errors, data } =
        type === 'products' ? validateProductRow(row, context) : validateCustomerRow(row, context);
      return { ...data, _rowNumber: row._rowNumber, _errors: errors };
    });
  }

  // حفظ الصفوف الصحيحة فقط داخل transaction واحد
  apply({ type, rows, branch_id = 1, created_by }) {
    if (!this.isValidType(type)) throw new Error('نوع الاستيراد غير مدعوم');
    if (!Array.isArray(rows) || !rows.length) throw new Error('لا توجد بيانات للاستيراد');

    const db = getDatabase();
    const validated = this.preview(type, rows, branch_id);
    const valid = validated.filter((row) => !row._errors.length);
    if (!valid.length) {
      throw new Error('كل الصفوف تحتوي على أخطاء، لا يمكن الاستيراد');
    }

    const inserted = db.transaction(() => {
      let count = 0;
      if (type === 'products') {
        const categoryMap = new Map(
          db
            .prepare('SELECT id, name FROM categories WHERE branch_id = ? AND is_deleted = 0')
            .all(branch_id)
            .map((row) => [String(row.name).trim(), row.id])
        );
        const units = db.prepare('SELECT id, name, symbol FROM units WHERE is_deleted = 0').all();
        const unitMap = new Map();
        units.forEach((unit) => {
          unitMap.set(String(unit.name).trim(), unit.id);
          unitMap.set(String(unit.symbol).trim(), unit.id);
        });

        const insert = db.prepare(
          `INSERT INTO products (branch_id, name, barcode, category_id, unit_id, cost_price, sale_price, min_stock_alert, is_active, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
        );
        for (const row of valid) {
          insert.run(
            branch_id,
            row.name,
            row.barcode || null,
            categoryMap.get(row.category) || null,
            unitMap.get(row.unit) || null,
            row.cost_price,
            row.sale_price,
            row.min_stock_alert,
            created_by || null
          );
          count += 1;
        }
      } else {
        const insert = db.prepare(
          `INSERT INTO customers (branch_id, name, phone, email, address, opening_balance, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        for (const row of valid) {
          insert.run(branch_id, row.name, row.phone || null, row.email || null, row.address || null, row.opening_balance, created_by || null);
          count += 1;
        }
      }
      return count;
    })();

    auditRepository.log({
      userId: created_by || null,
      module: type,
      action: 'import',
      recordId: null,
      oldValue: null,
      newValue: { imported: inserted, skipped: validated.length - inserted },
    });

    return {
      imported: inserted,
      total: validated.length,
      skipped: validated.length - inserted,
      errors: validated.filter((row) => row._errors.length),
    };
  }
}

function validateProductRow(row, context) {
  const errors = [];
  const data = {
    name: toString(row.name),
    barcode: toString(row.barcode),
    category: toString(row.category),
    unit: toString(row.unit),
  };

  if (!data.name) errors.push('اسم المنتج مطلوب');

  if (data.barcode) {
    if (context.seenBarcodes.has(data.barcode)) errors.push('الباركود مكرر داخل الملف');
    else context.seenBarcodes.add(data.barcode);
    if (context.existingBarcodes.has(data.barcode)) errors.push('الباركود موجود مسبقًا في قاعدة البيانات');
  }

  const cost = toNumber(row.cost_price);
  if (cost === null) errors.push('سعر التكلفة مطلوب ويجب أن يكون رقمًا');
  else if (Number.isNaN(cost)) errors.push('سعر التكلفة ليس رقمًا صالحًا');
  else if (cost < 0) errors.push('سعر التكلفة لا يمكن أن يكون سالبًا');
  else data.cost_price = cost;

  const sale = toNumber(row.sale_price);
  if (sale === null) errors.push('سعر البيع مطلوب ويجب أن يكون رقمًا');
  else if (Number.isNaN(sale)) errors.push('سعر البيع ليس رقمًا صالحًا');
  else if (sale < 0) errors.push('سعر البيع لا يمكن أن يكون سالبًا');
  else data.sale_price = sale;

  const minAlert = toNumber(row.min_stock_alert);
  if (minAlert === null || Number.isNaN(minAlert)) data.min_stock_alert = 0;
  else if (minAlert < 0) errors.push('حد تنبيه المخزون لا يمكن أن يكون سالبًا');
  else data.min_stock_alert = minAlert;

  if (!('cost_price' in data)) data.cost_price = 0;
  if (!('sale_price' in data)) data.sale_price = 0;

  return { errors, data };
}

function validateCustomerRow(row, context) {
  const errors = [];
  const data = {
    name: toString(row.name),
    phone: toString(row.phone),
    email: toString(row.email),
    address: toString(row.address),
  };

  if (!data.name) errors.push('اسم العميل مطلوب');

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }

  if (data.phone) {
    if (context.seenPhones.has(data.phone)) errors.push('رقم الهاتف مكرر داخل الملف');
    else context.seenPhones.add(data.phone);
  }

  const balance = toNumber(row.opening_balance);
  if (balance === null) {
    data.opening_balance = 0;
  } else if (Number.isNaN(balance)) {
    errors.push('الرصيد الافتتاحي يجب أن يكون رقمًا');
  } else if (balance < 0) {
    errors.push('الرصيد الافتتاحي لا يمكن أن يكون سالبًا');
  } else {
    data.opening_balance = balance;
  }

  return { errors, data };
}

module.exports = new ImportService();
