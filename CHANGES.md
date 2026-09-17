# محدثات المشروع (CHANGES)

## 2026-09-17 - إصدار جديد

### 1. القوالب المحاسبية في الإعدادات العامة
- **الملف**: `src/modules/settings/pages/SettingsPage.jsx`
- **الوصف**: تم نقل اختيار القوالب المحاسبية (السعودية، المصر) من القائمة الجانبية إلى تبويب مستقل داخل الإعدادات العامة.
- **الميزات**:
  - اختيار القالب المحاسبي المناسب للدولة.
  - إنشاء دليل محاسبي مخصص.
  - تطبيق القالب يضيف الحسابات الناقصة فقط.

### 2. ضرائب حسب الدولة
- **الملفات**:
  - `electron/database/migrations/001_initial_schema.sql`
  - `electron/database/db.js`
  - `electron/repositories/sales.repository.js`
  - `electron/repositories/purchase.repository.js`
- **الوصف**: فصل ضريبة المبيعات عن ضريبة المشتريات، مع دعم الدول المختلفة.
- **القواعد الافتراضية**:
  | الدولة | ضريبة المبيعات | ضريبة المشتريات |
  |-------|----------------|-----------------|
  | السعودية | 15% | 15% |
  | مصر | 14% | 14% |
  | الإمارات | 5% | 5% |
  | البحرين | 10% | 10% |
  | عُمان | 5% | 5% |
  | الكويت | 5% | 5% |
  | قطر | 0% | 0% |

### 3. اختيار الضرائب عند إنشاء الفاتورة
- **الملفات**:
  - `electron/utils/tax.js` (محرك الضرائب الجديد)
  - `electron/repositories/tax.repository.js`
  - `electron/services/tax.service.js`
  - `electron/ipc/taxes.ipc.js`
  - `electron/preload.js`
- **الوصف**: إضافة قائمة اختيار الضرائب داخل فواتير البيع والشراء والـ POS.
- **الميزات**:
  - اختيار الضريبة المطبقة.
  - تعديل النسبة الائتمانية.
  - إدخال القيمة يدوياً (تُحسب تلقائياً من النسبة).
  - دعم ضرائب الحجز (Withholding Tax) غير المفعّلة افتراضياً.

### 4. إظهار الضرائب في الفاتورة
- **الملفات**:
  - `src/modules/sales/pages/SalesPage.jsx`
  - `src/modules/purchases/pages/PurchaseInvoicesPage.jsx`
- **الوصف**: إظهار اسم الضريبة ونسبتها ومبلغها في قوائم الفواتير.
- **العمود الجديد**: "الضرائب" يعرض القيمة الإجمالية مع تفاصيل كل ضريبة.

### 5. زر الطباعة في الفواتير
- **الملفات**:
  - `src/modules/sales/pages/SalesPage.jsx`
  - `src/modules/purchases/pages/PurchaseInvoicesPage.jsx`
- **الوصف**: إضافة زر طباعة لكل فاتورة في القائمة.
- **الوظيفة**: يرسل الفاتورة إلى طابعة POS عبر `window.api.hardware.printReceipt`.

### 6. إدارة التصنيفات (Categories)
- **الملفات الجديدة**:
  - `electron/repositories/category.repository.js`
  - `electron/services/category.service.js`
  - `electron/ipc/categories.ipc.js`
  - `src/modules/inventory/pages/CategoriesPage.jsx`
- **الوصف**: إنشاء شاشة إدارة تصنيفات المخزون والمنتجات.
- **الميزات**:
  - إضافة/تعديل/حذف التصنيفات.
  - دعم التصنيفات الفرعية.
  - ربطها بمنتجات المخزون.

### 7. قوائم العملات والتقويم
- **الملف**: `src/modules/settings/pages/SettingsPage.jsx`
- **الوصف**: استبدال حقل العملة النصي بقائمة اختيار، وإضافة خيار التقويم (ميلادي/هجري).
- **العملات المدعومة**: SAR, EGP, AED, KWD, QAR, BHD, USD, EUR.

### 8. فاتورة تجريبية للمعاينة
- **الملف**: `electron/database/seeders/001_initial_seeds.js`
- **الوصف**: إنشاء فاتورتين تجريبيتين (بيع وشراء) مع المنتجات والمخزون والعملاء والموردين.

---

## قواعد الحساب الحالية

### حساب الضريبة في الواجهة
```
subtotal = مجموع سلة المشتريات
discount = الخصم المدخل
taxableSubtotal = subtotal - discount
tax = Σ (قيمة الضريبة لكل قاعدة)
total = taxableSubtotal + tax
```

### حساب الضريبة في الخلفية (electron/utils/tax.js)
```javascript
// إذا كانت القيمة محددة يدوياً:
amount = value
// إذا لم تكن محددة:
amount = taxableSubtotal * (rate / 100)
```

### حفظ الفاتورة
- تُحفظ تفاصيل الضريبة في حقل JSON `tax_details`.
- تُحفظ النسبة والقيمة في `tax_overrides` عند إرسالها.
- يتم توحيد النسبة والقيمة بين الواجهة والخلفية.

---

## مسارات الملفات المهمة

| الوظيفة | المسار |
|--------|--------|
| إعدادات الشركة | `src/modules/settings/pages/SettingsPage.jsx` |
| فاتورة مبيعات | `src/modules/sales/pages/SalesPage.jsx` |
| فاتورة شراء | `src/modules/purchases/pages/PurchaseInvoicesPage.jsx` |
| نقطة البيع (POS) | `src/modules/pos/pages/PosPage.jsx` |
| إدارة التصنيفات | `src/modules/inventory/pages/CategoriesPage.jsx` |
| محرك الضرائب | `electron/utils/tax.js` |
| قاعدة البيانات | `electron/database/db.js` |
| قاعدة التصنيفات | `electron/repositories/category.repository.js` |
| قواعد الضرائب | `electron/repositories/tax.repository.js` |