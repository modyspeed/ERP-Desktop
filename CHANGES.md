# محدثات المشروع (CHANGES)

## 2026-09-27 - تقارير مالية جديدة (ميزان المراجعة - قائمة الدخل - الميزانية العمومية)

### 1) ميزان المراجعة (Trial Balance)
- **الملفات**:
  - `electron-src/repositories/report.repository.js`
  - `electron-src/services/report.service.js`
  - `electron-src/ipc/report.ipc.js`
  - `electron-src/preload.js`
  - `src/modules/reports/pages/ReportsPage.jsx`
- **الوصف**: جدول بكل حسابات `chart_of_accounts` مع مجموع حركتها مدينًا ودائنًا من `journal_entry_lines` خلال فترة محددة، مع صف الإجمالي في النهاية.
- **التحقق من التوازن**: إذا اختلف إجمالي المدين عن إجمالي الدائن يظهر تنبيه أحمر واضح (علامة خطأ في القيود). رياضيًا يجب أن يتساويا دائمًا لأن كل قيد متوازن بطبيعته.
- **النتيجة على بيانات التجربة**: إجمالي المدين = إجمالي الدائن = 514.05 (متوازن).

### 2) قائمة الدخل (Income Statement)
- **الملفات**: نفس ملفات ميزان المراجعة.
- **الوصف**: تجميع حسابات الإيراد (`account_type='revenue'`) ناقص حسابات المصروفات (`account_type='expense'`) خلال فترة، وإظهار صافي الربح/الخسارة مع تلوين النتيجة.
- **النتيجة على بيانات التجربة**: الإيرادات 207.00، المصروفات 0.00، صافي الربح 207.00.

### 3) الميزانية العمومية (Balance Sheet)
- **الملفات**: نفس ملفات ميزان المراجعة.
- **الوصف**: تجميع الأصول مقابل الخصوم + حقوق الملكية في تاريخ لحظي واحد (وليس فترة). تُرحّل أرباح/خسائر الفترة الحالية تلقائيًا ضمن حقوق الملكية لتتوازن المعادلة.
- **النتيجة على بيانات التجربة**: الأصول 514.05 = الخصوم 307.05 + حقوق الملكية 207.05→207 = 514.05 (متوازنة).

### 4) تصدير PDF/Excel وفلتر الفرع
- **الملف**: `src/modules/reports/pages/ReportsPage.jsx`
- **الوصف**:
  - زر تصدير PDF جديد لكل التقارير يفتح حوار الطباعة (يُحفظ PDF منه)، مع الحفاظ على تصدير CSV/Excel والطباعة المباشرة.
  - فلتر الفرع يظهر تلقائيًا فقط لو كان هناك أكثر من فرع.
  - الميزانية العمومية تستخدم حقل تاريخ واحد (تاريخ لحظي) بدل فترة بداية/نهاية.

### 5) ترحيل قيود الفواتير التجريبية
- **الملفات**:
  - `electron-src/database/seeders/001_initial_seeds.js`
  - `electron-src/database/db.js`
- **الوصف**: البذور كانت تنشئ الفواتير التجريبية مباشرةً دون ترحيل قيود محاسبية، مما يجعل التقارير المالية فارغة. الآن:
  - تنشئ البذور نفس القيود المتوازنة التي ينشئها مسار حفظ الفاتورة العادي.
  - تُضاف دالة `backfillMissingJournalEntries` في `db.js` لترحيل القيود الناقصة لقواعد البيانات القديمة (تُشغل مرة واحدة فقط).

---

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