# ملف متطلبات المشروع
## نظام ERP متكامل - تطبيق سطح مكتب (Vite.js + Electron)

---

> ### ⚠️ ملاحظة إلزامية لفريق/منصة التنفيذ
> هذا المستند هو **المرجع الرسمي والملزم** لتنفيذ المشروع. يجب الالتزام بكل بند فيه حرفيًا (التقنيات المحددة في القسم 2، القرارات المعتمدة في القسم 11، وكل المتطلبات الوظيفية وغير الوظيفية)، وعدم استبدال أي تقنية أو تصميم مذكور بدون الرجوع لصاحب المشروع أولاً. أي نقطة غير واضحة أو غير مذكورة صراحة، يجب طرح سؤال توضيحي بدلاً من الافتراض والتنفيذ العشوائي.

---

## 1. نظرة عامة على المشروع

| البند | التفاصيل |
|---|---|
| **اسم المشروع المبدئي** | (قابل للتخصيص من الإعدادات) |
| **نوع التطبيق** | تطبيق سطح مكتب (Windows) قائم على الويب |
| **الفئة المستهدفة** | شركات / مؤسسات / محلات — أي حجم (صغير - متوسط - كبير) وأي نشاط تجاري |
| **الهدف الرئيسي** | نظام ERP شامل، مرن، سهل الاستخدام والصيانة والتطوير، بتصميم عصري وجذاب |
| **نموذج الاستخدام** | تركيب محلي (Local) على جهاز العميل، مع إمكانية التوسع لاحقًا لدعم الشبكة (Multi-user) |

---

## 2. التقنيات المستخدمة (Tech Stack)

### الواجهة الأمامية (Frontend)
- **Vite.js** — كأداة بناء وتطوير (Build Tool)
- **إطار عمل الواجهة**: React (يُفضّل، للتوافق مع باقي مشاريعك) أو Vue — يُحدَّد قبل البدء
- مكتبة تصميم UI (مثل Bootstrap 5 / Tailwind / أو مكتبة مخصصة تحاكي تصميم Apple)
- مكتبة أيقونات كبيرة الحجم بأسلوب Apple (SF Symbols-like) — مثل **Phosphor Icons** أو **Lucide** أو **Tabler Icons** بحجم كبير ومرونة الألوان
- مكتبة رسوم بيانية (Charts) — مثل Recharts / ApexCharts
- دعم كامل للغة العربية (RTL) + اللغة الإنجليزية (LTR) قابل للتبديل

### طبقة سطح المكتب (Desktop Layer)
- **Electron** — لتغليف التطبيق كبرنامج Windows (.exe)
- **electron-builder** — لبناء ملف التثبيت (Installer) وملف Portable
- **electron-updater** — لدعم التحديث التلقائي مستقبلاً (Auto-Update)
- تكامل مع نظام الملفات المحلي (File System) للنسخ الاحتياطي والاستيراد/التصدير
- دعم الطباعة المباشرة (الفواتير، التقارير) عبر Electron print API

### قاعدة البيانات (Database)
- قاعدة بيانات محلية تعمل بدون إنترنت: **SQLite** (عبر better-sqlite3) — الخيار الأنسب لتطبيق Electron مستقل
- بديل للتوسع المستقبلي: إمكانية الاتصال بخادم MySQL/PostgreSQL عند الحاجة لعمل الشبكة (Multi-branch / Multi-user)
- ORM لإدارة قاعدة البيانات: Prisma أو Drizzle أو Knex (يُحدَّد حسب قاعدة البيانات المختارة)

### الأمان
- تشفير كلمات المرور (bcrypt)
- تشفير قاعدة البيانات أو ملفات النسخ الاحتياطي (اختياري)
- نظام صلاحيات متعدد المستويات (Roles & Permissions)
- سجل تتبع العمليات (Audit Log) لكل إضافة/تعديل/حذف

---

## 3. الهوية والتخصيص (Branding & Settings)

يجب أن يوفر التطبيق **صفحة إعدادات عامة** تتيح للمستخدم (صاحب النشاط) تخصيص:

- **اسم الشركة/المؤسسة/المحل** (يظهر في العنوان، الفواتير، التقارير، شاشة البداية)
- **الشعار (اللوجو)** — رفع صورة، وعرضها في: الشريط الجانبي، شاشة تسجيل الدخول، الفواتير المطبوعة، التقارير
- **بيانات الشركة**: العنوان، الهاتف، البريد الإلكتروني، الرقم الضريبي/السجل التجاري
- **العملة الافتراضية** ورمزها
- **اللغة الافتراضية** (عربي/إنجليزي)
- **نمط الألوان (Theme)** — اختيار لون رئيسي من مجموعة ألوان جذابة، أو تخصيص لون مخصص
- **الوضع الليلي/النهاري (Dark/Light Mode)** — تبديل فوري مع حفظ التفضيل
- **إعدادات الطباعة** (حجم الفاتورة: A4 / حراري 80مم / حراري 58مم)
- **إعدادات الضرائب** (نسبة الضريبة، تفعيل/تعطيل)
- **رقم تسلسلي للفواتير والمستندات** قابل للتخصيص (Prefix/Format)

---

## 4. متطلبات التصميم (UI/UX)

| المتطلب | الوصف |
|---|---|
| **الطراز العام** | تصميم عصري (Modern)، أنيق، مستوحى من تصميمات Apple (بساطة، مساحات بيضاء، ظلال ناعمة، حواف دائرية) |
| **الأيقونات** | أيقونات كبيرة وواضحة، أسلوب موحّد، ألوان متناسقة لكل قسم/وحدة |
| **الألوان** | لوحة ألوان ساحرة وجذابة (Gradient خفيف، ألوان أساسية هادئة + ألوان تمييز Accent Colors) |
| **الوضع الليلي (Dark Mode)** | دعم كامل مع تباين مريح للعين، وتبديل سلس بدون كسر أي عنصر تصميم |
| **الشريط الجانبي (Sidebar)** | قابل للطي، يعرض الوحدات الرئيسية بأيقونات كبيرة + نص |
| **لوحة التحكم (Dashboard)** | بطاقات إحصائية (KPI Cards) + رسوم بيانية تفاعلية + اختصارات سريعة |
| **الاستجابة (Responsiveness)** | يعمل بسلاسة على مختلف أحجام الشاشات وأحجام نافذة سطح المكتب |
| **التنقل** | سريع وسلس (بدون إعادة تحميل الصفحة كاملة - SPA) |
| **الإشعارات (Notifications/Toasts)** | نظام إشعارات أنيق لعمليات النجاح/الخطأ/التنبيه |
| **تجربة الاستخدام** | بسيطة وسهلة حتى لغير المتخصصين، مع دعم اختصارات لوحة المفاتيح للعمليات المتكررة (مثال: فاتورة جديدة، بحث سريع) |

---

## 5. الوحدات والوظائف الأساسية (Core Modules)

### 5.1 لوحة التحكم (Dashboard)
- ملخص عام: المبيعات، المصروفات، الأرباح، المخزون المنخفض، الفواتير المستحقة
- رسوم بيانية (يومي/أسبوعي/شهري/سنوي)
- تنبيهات ذكية (نفاد مخزون، فواتير متأخرة، مهام معلقة)

### 5.2 المبيعات (Sales)
- عملاء (بيانات، تصنيف، رصيد، تاريخ تعاملات)
- عروض أسعار (Quotations)
- فواتير بيع
- مرتجعات بيع
- خصومات وعروض
- متابعة المديونيات (Receivables)

### 5.3 نقطة البيع - POS
- واجهة بيع سريعة (شاشة لمس مناسبة)
- بحث سريع بالباركود/الاسم/الكود
- دعم قارئ الباركود (Barcode Scanner)
- دعم شاشة عرض العميل (Customer Display) — اختياري
- دعم أدراج النقود (Cash Drawer) والطابعات الحرارية
- طرق دفع متعددة (نقدي، بطاقة، آجل، مختلط)
- جلسات كاشير (فتح/إغلاق وردية + تسوية الصندوق)
- طباعة فاتورة فورية بعد كل عملية بيع

### 5.4 المشتريات (Purchasing)
- موردين (بيانات، تصنيف، رصيد)
- طلبات شراء
- فواتير شراء
- مرتجعات شراء
- متابعة المستحقات (Payables)

### 5.5 المخزون والمستودعات (Inventory & Warehouses)
- إدارة أصناف/منتجات (بالباركود، صور، وحدات قياس متعددة)
- تصنيفات وأقسام للمنتجات
- إدارة أكثر من مستودع/فرع
- حركة مخزون (وارد/صادر/تحويل بين مستودعات/تسوية جرد)
- حد إعادة الطلب (Reorder Point) وتنبيهات نفاد المخزون
- جرد دوري ومطابقة الفروقات
- دعم الصور المتعددة لكل صنف

### 5.6 الحسابات والمالية (Accounting/Finance)
- دليل حسابات (Chart of Accounts)
- قيود يومية (Double-Entry Journal)
- دفتر الأستاذ العام (General Ledger)
- ميزان المراجعة (Trial Balance)
- قائمة الدخل (Income Statement)
- الميزانية العمومية (Balance Sheet)
- الخزينة والبنوك (Cash & Bank Management)
- سندات قبض وصرف

### 5.7 الموارد البشرية (HR)
- بيانات الموظفين
- الحضور والانصراف
- الإجازات والأذونات
- الرواتب والحوافز (مرتبط تلقائيًا بقيد محاسبي)

### 5.8 العملاء والموردون (CRM أساسي)
- سجل تواصل وتاريخ تعاملات
- متابعة الفرص والعروض (اختياري للتوسع المستقبلي)

### 5.9 التقارير (Reports)
- تقارير قابلة للطباعة والتصدير لكل وحدة (مبيعات، مشتريات، مخزون، حسابات، موظفين)
- فلاتر متقدمة (تاريخ، فرع، مستودع، عميل/مورد، صنف)
- تصدير PDF / Excel / CSV

### 5.10 إدارة المستخدمين والصلاحيات
- أدوار متعددة (مدير عام، محاسب، أمين مخزن، مندوب مبيعات/كاشير، موارد بشرية، مشاهد فقط)
- صلاحيات دقيقة لكل وحدة وعملية (عرض/إضافة/تعديل/حذف/طباعة)
- سجل تتبع كامل (من قام بماذا ومتى)

---

## 6. دعم الملفات والاستيراد/التصدير

- دعم رفع وعرض جميع أنواع الصور (JPG, PNG, WEBP, GIF) للمنتجات والشعارات والموظفين
- دعم إرفاق ملفات متنوعة بالمستندات (PDF, Word, Excel, صور) — مثل إرفاق فاتورة مورد أو عقد
- **الاستيراد (Import)**: استيراد بيانات (عملاء، منتجات، أرصدة افتتاحية) من Excel/CSV مع معاينة قبل التأكيد
- **التصدير (Export)**: تصدير أي شاشة/تقرير إلى Excel / CSV / PDF
- معالجة أخطاء الاستيراد (عرض الصفوف الخاطئة مع سبب الخطأ)

---

## 7. النسخ الاحتياطي والاستعادة (Backup & Restore)

- نسخ احتياطي يدوي لقاعدة البيانات بضغطة زر (حفظ في مكان يحدده المستخدم)
- نسخ احتياطي تلقائي مجدول (يومي/أسبوعي) لملف محلي أو مجلد مخصص
- استعادة (Restore) من نسخة احتياطية سابقة مع تأكيد وتحذير
- إمكانية تصدير نسخة كاملة من البيانات (Full Data Export) بصيغة قابلة للنقل بين الأجهزة

---

## 8. متطلبات التوزيع على Windows (Packaging)

- بناء ملف تثبيت Windows (.exe) عبر electron-builder
- إصدار Portable لا يحتاج تثبيت (اختياري)
- أيقونة تطبيق مخصصة (تتغير حسب شعار العميل إن أمكن مستقبلاً)
- دعم التحديث التلقائي مستقبلاً (Auto-Update) عبر خادم تحديثات
- توقيع رقمي للتطبيق (Code Signing) — لتفادي تحذيرات Windows Defender (يتطلب شهادة لاحقًا)

---

## 9. المتطلبات غير الوظيفية (Non-Functional Requirements)

| المتطلب | الوصف |
|---|---|
| **المرونة (Flexibility)** | بنية معيارية (Modular) بحيث يمكن تفعيل/تعطيل أي وحدة حسب نوع النشاط |
| **سهولة الصيانة** | كود منظم، فصل واضح بين الطبقات (Frontend/Backend/DB)، توثيق داخلي |
| **قابلية التطوير** | إمكانية إضافة وحدات جديدة مستقبلاً دون التأثير على الوحدات الحالية |
| **الأداء** | استجابة سريعة حتى مع بيانات كبيرة (آلاف الفواتير والأصناف) |
| **الاستقرار** | معالجة الأخطاء بشكل آمن مع رسائل واضحة للمستخدم |
| **الأمان** | حماية البيانات، صلاحيات دقيقة، نسخ احتياطي دوري |
| **العمل دون إنترنت (Offline-first)** | التطبيق يعمل بالكامل محليًا بدون الحاجة لاتصال إنترنت |

---

## 10. مراحل التطوير المقترحة (Roadmap)

1. **المرحلة الأولى — الأساسيات**: هيكل المشروع (Vite + Electron)، تسجيل الدخول، الصلاحيات، الإعدادات العامة والهوية، لوحة التحكم
2. **المرحلة الثانية — الوحدات الجوهرية**: المخزون، المبيعات، المشتريات، نقطة البيع (POS)
3. **المرحلة الثالثة — الحسابات**: دليل الحسابات، القيود، التقارير المالية
4. **المرحلة الرابعة — الموارد البشرية**: الموظفين، الحضور، الرواتب
5. **المرحلة الخامسة — التقارير والتصدير الشامل**
6. **المرحلة السادسة — النسخ الاحتياطي، التوزيع، والتغليف النهائي لـ Windows**

---

## 11. القرارات المعتمدة (محدَّثة)

| البند | القرار |
|---|---|
| **إطار العمل الأمامي** | **React** — الأنسب هنا لأنه أوسع انتشارًا لمشاريع Electron، عدد مكتبات جاهزة أكبر (خاصة لأيقونات وواجهات POS ودارك مود)، وأسهل في التوظيف والصيانة مستقبلاً |
| **قاعدة البيانات** | **SQLite محليًا** في الإصدار الأول (عبر better-sqlite3)، مع تصميم طبقة الوصول للبيانات (Data Access Layer) بشكل مستقل عن قاعدة البيانات (Repository Pattern) حتى يسهل لاحقًا الانتقال إلى MySQL/PostgreSQL بدون إعادة كتابة منطق التطبيق |
| **دعم الفروع المتعددة (Multi-branch)** | غير مفعّل بالكامل في الإصدار الأول، لكن **قاعدة البيانات والنماذج (Models) تُصمَّم من البداية بحقل `branch_id`** في كل الجداول الأساسية (مخزون، فواتير، خزينة) حتى يكون تفعيل الفروع المتعددة لاحقًا مجرد إضافة شاشات وصلاحيات دون تعديل هيكلي جذري |
| **أجهزة نقطة البيع (POS Hardware)** | التطبيق **شامل** ويدعم بنية عامة (Generic) للتعامل مع: طابعات حرارية (عبر ESC/POS القياسي عبر USB/الشبكة)، قارئ باركود (كمحاكاة لوحة مفاتيح - Keyboard Wedge، وهو المعيار الأشهر ولا يحتاج تعريف خاص)، ودرج نقود (يُفتح عادة عبر أمر مرسل من الطابعة الحرارية). التصميم يكون بطبقة "محوّلات أجهزة" (Hardware Adapters) قابلة للتوسع لإضافة أي موديل جديد لاحقًا |
| **اللغات** | **عربي/إنجليزي** بالكامل — تبديل فوري من الإعدادات، مع دعم RTL/LTR تلقائي حسب اللغة المختارة، وتخزين كل النصوص عبر نظام ترجمة (i18n) بدل النصوص الثابتة في الكود |

### أثر هذه القرارات على البنية التقنية
- **الواجهة**: React 18 + Vite + React Router + مكتبة i18n (مثل `react-i18next`) لدعم عربي/إنجليزي وRTL/LTR
- **قاعدة البيانات**: SQLite (better-sqlite3) + طبقة Repository/DAO منفصلة عن منطق العرض والتحكم، بحيث يكون الانتقال لخادم مركزي مستقبلاً (Multi-branch حقيقي عبر الشبكة) تغييرًا في طبقة الاتصال فقط
- **الجداول**: كل جدول رئيسي (فواتير، مخزون، خزينة، حركات) يحمل حقل `branch_id` منذ البداية (بقيمة افتراضية لفرع واحد حاليًا)
- **POS**: طبقة "Hardware Adapter" مستقلة عن منطق البيع، تتعامل مع الطابعة/الباركود/الدرج كـ Interfaces قابلة للتوسع دون تعديل شاشة البيع نفسها

---

## 12. تصميم قاعدة البيانات التفصيلي (Database Schema)

> ملاحظة: الأسماء أدناه بالإنجليزية (معيار تسمية الجداول/الأعمدة في الأكواد)، وكل الحقول القابلة للعرض للمستخدم (labels) تُترجَم عبر نظام i18n. كل جدول رئيسي يحتوي على: `id` (PK)، `branch_id`، `created_at`، `updated_at`، `created_by`، `is_deleted` (Soft Delete) ما لم يُذكر غير ذلك.

### 12.1 المستخدمون والصلاحيات
| الجدول | الأعمدة الأساسية | العلاقات |
|---|---|---|
| `users` | id, full_name, username, password_hash, email, phone, avatar, role_id, is_active | FK → roles |
| `roles` | id, name, description | - |
| `permissions` | id, module, action (view/create/edit/delete/print/export) | - |
| `role_permissions` | id, role_id, permission_id | FK → roles, permissions |
| `audit_logs` | id, user_id, module, action, record_id, old_value(JSON), new_value(JSON), ip, created_at | FK → users |

### 12.2 الإعدادات والهوية
| الجدول | الأعمدة الأساسية |
|---|---|
| `company_settings` | id, company_name, logo_path, address, phone, email, tax_number, currency_code, default_language, theme_color, dark_mode_default, invoice_prefix_sales, invoice_prefix_purchase, tax_percentage, tax_enabled |
| `branches` | id, name, address, phone, is_main_branch, is_active |

### 12.3 المخزون والمنتجات
| الجدول | الأعمدة الأساسية | العلاقات |
|---|---|---|
| `categories` | id, name, parent_id (تصنيفات شجرية) | self-FK |
| `units` | id, name, symbol | - |
| `products` | id, sku, barcode, name, category_id, unit_id, cost_price, sale_price, tax_included, min_stock_alert, is_active | FK → categories, units |
| `product_images` | id, product_id, image_path, is_primary | FK → products |
| `warehouses` | id, branch_id, name, location | FK → branches |
| `stock_levels` | id, product_id, warehouse_id, quantity | FK → products, warehouses (unique product+warehouse) |
| `stock_movements` | id, product_id, warehouse_id, movement_type (in/out/transfer/adjustment), quantity, reference_type, reference_id, notes | FK → products, warehouses |

### 12.4 العملاء والموردون
| الجدول | الأعمدة الأساسية |
|---|---|
| `customers` | id, name, phone, email, address, tax_number, credit_limit, opening_balance, current_balance, category |
| `suppliers` | id, name, phone, email, address, tax_number, opening_balance, current_balance |

### 12.5 المبيعات
| الجدول | الأعمدة الأساسية | العلاقات |
|---|---|---|
| `quotations` | id, customer_id, quote_number, date, expiry_date, status, total_amount | FK → customers |
| `quotation_items` | id, quotation_id, product_id, qty, unit_price, discount, tax | FK → quotations, products |
| `sales_invoices` | id, invoice_number, customer_id, warehouse_id, branch_id, date, subtotal, discount, tax_amount, total, paid_amount, remaining_amount, payment_status, invoice_type (cash/credit), source (pos/manual) | FK → customers, warehouses |
| `sales_invoice_items` | id, invoice_id, product_id, qty, unit_price, discount, tax, line_total | FK → sales_invoices, products |
| `sales_returns` | id, invoice_id, return_number, date, total_amount, reason | FK → sales_invoices |
| `sales_return_items` | id, return_id, product_id, qty, unit_price | FK → sales_returns, products |

### 12.6 المشتريات
| الجدول | الأعمدة الأساسية |
|---|---|
| `purchase_orders` | id, supplier_id, po_number, date, status, total_amount |
| `purchase_order_items` | id, po_id, product_id, qty, unit_cost |
| `purchase_invoices` | id, invoice_number, supplier_id, warehouse_id, date, subtotal, tax_amount, total, paid_amount, remaining_amount, payment_status |
| `purchase_invoice_items` | id, invoice_id, product_id, qty, unit_cost, line_total |
| `purchase_returns` | id, invoice_id, return_number, date, total_amount |

### 12.7 نقطة البيع (POS)
| الجدول | الأعمدة الأساسية |
|---|---|
| `pos_sessions` | id, cashier_id, branch_id, opening_balance, closing_balance, expected_balance, difference, opened_at, closed_at, status |
| `pos_transactions` | id, session_id, invoice_id, payment_method (cash/card/mixed/credit), amount_paid, change_due |

### 12.8 الحسابات والمالية
| الجدول | الأعمدة الأساسية |
|---|---|
| `chart_of_accounts` | id, code, name, account_type (asset/liability/equity/revenue/expense), parent_id |
| `journal_entries` | id, entry_number, date, description, reference_type, reference_id, is_posted |
| `journal_entry_lines` | id, journal_entry_id, account_id, debit, credit |
| `cash_accounts` | id, name, type (cash/bank), opening_balance, current_balance |
| `cash_transactions` | id, cash_account_id, type (in/out), amount, reference_type, reference_id, date, notes |

### 12.9 الموارد البشرية
| الجدول | الأعمدة الأساسية |
|---|---|
| `employees` | id, full_name, phone, email, position, department, salary_base, hire_date, is_active |
| `attendance` | id, employee_id, date, check_in, check_out, status |
| `leaves` | id, employee_id, leave_type, start_date, end_date, status, reason |
| `payrolls` | id, employee_id, month, base_salary, allowances, deductions, net_salary, journal_entry_id, status |

### 12.10 المرفقات العامة (لأي وحدة)
| الجدول | الأعمدة الأساسية |
|---|---|
| `attachments` | id, related_type, related_id, file_path, file_type, file_name, uploaded_by |

---

## 13. هيكلة المشروع (Folder Structure)

```
erp-desktop-app/
├── electron/                      # طبقة Electron (Main Process)
│   ├── main.js                    # نقطة دخول Electron
│   ├── preload.js                 # جسر آمن بين Main و Renderer (contextBridge)
│   ├── ipc/                       # معالجات IPC مقسمة حسب الوحدة
│   │   ├── auth.ipc.js
│   │   ├── products.ipc.js
│   │   ├── sales.ipc.js
│   │   ├── purchases.ipc.js
│   │   ├── inventory.ipc.js
│   │   ├── accounting.ipc.js
│   │   ├── hr.ipc.js
│   │   ├── pos.ipc.js
│   │   ├── reports.ipc.js
│   │   ├── settings.ipc.js
│   │   └── backup.ipc.js
│   ├── database/
│   │   ├── db.js                  # اتصال SQLite (better-sqlite3)
│   │   ├── migrations/            # ملفات إنشاء/تحديث الجداول
│   │   └── seeders/                # بيانات أولية (أدوار، إعدادات افتراضية)
│   ├── repositories/               # طبقة Repository (فصل منطق DB عن IPC)
│   │   ├── product.repository.js
│   │   ├── sales.repository.js
│   │   └── ...
│   ├── services/                   # منطق العمل (Business Logic)
│   │   ├── invoice.service.js      # حساب الإجمالي، الضريبة، ترقيم الفواتير
│   │   ├── stock.service.js        # تحديث المخزون، منع السالب
│   │   ├── journal.service.js      # إنشاء القيود التلقائية
│   │   └── backup.service.js
│   ├── hardware/                   # طبقة محوّلات الأجهزة (POS)
│   │   ├── printer.adapter.js      # ESC/POS
│   │   ├── barcode.adapter.js
│   │   └── cashdrawer.adapter.js
│   └── utils/
│       ├── logger.js
│       └── numbering.js            # توليد أرقام مستندات غير متضاربة
│
├── src/                            # واجهة React (Renderer Process)
│   ├── main.jsx
│   ├── App.jsx
│   ├── assets/                     # صور، أيقونات، خطوط
│   ├── locales/                    # ملفات الترجمة
│   │   ├── ar.json
│   │   └── en.json
│   ├── theme/                      # نظام الألوان + Dark/Light Mode
│   │   ├── theme.js
│   │   └── ThemeProvider.jsx
│   ├── layouts/
│   │   ├── MainLayout.jsx          # الشريط الجانبي + الهيدر
│   │   └── AuthLayout.jsx
│   ├── components/                 # عناصر مشتركة (Button, Card, Table, Modal...)
│   ├── modules/                    # كل وحدة في مجلد مستقل
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── purchases/
│   │   ├── pos/
│   │   ├── accounting/
│   │   ├── hr/
│   │   ├── reports/
│   │   ├── users/
│   │   └── settings/
│   │       └── (كل مجلد: pages/, components/, hooks/, api.js)
│   ├── router/
│   │   └── routes.jsx
│   ├── context/                    # AuthContext, SettingsContext
│   ├── hooks/                      # hooks عامة (usePermission, useTheme...)
│   └── utils/
│
├── build/                          # أيقونات وموارد التغليف (icon.ico...)
├── electron-builder.yml            # إعدادات بناء ملف التثبيت
├── vite.config.js
├── package.json
└── README.md
```

---

## 14. مخططات نصية للشاشات الرئيسية (Text Wireframes)

### 14.1 شاشة تسجيل الدخول
```
┌───────────────────────────────┐
│           [شعار الشركة]        │
│        اسم الشركة (ديناميكي)   │
│                                │
│   [ اسم المستخدم            ]  │
│   [ كلمة المرور        👁 ]     │
│   [ تذكرني ]      [نسيت كلمة المرور] │
│                                │
│        [   تسجيل الدخول   ]    │
│                                │
│   🌙/☀ تبديل الوضع الليلي      │
│   🌐 عربي / English            │
└───────────────────────────────┘
```

### 14.2 لوحة التحكم (Dashboard)
```
┌──────────┬──────────────────────────────────────────┐
│          │  الهيدر: [بحث] [إشعارات] [المستخدم] [🌙]   │
│ الشريط    ├──────────────────────────────────────────┤
│ الجانبي   │  [بطاقة: المبيعات اليوم]  [بطاقة: المصروفات] │
│          │  [بطاقة: فواتير مستحقة]  [بطاقة: مخزون منخفض]│
│ 🏠 الرئيسية│                                          │
│ 🛒 مبيعات  │  ┌─────────────┐  ┌────────────────────┐ │
│ 🧾 POS     │  │ رسم بياني    │  │ آخر الفواتير        │ │
│ 📦 مخزون   │  │ (مبيعات شهرية)│  │ (جدول سريع)        │ │
│ 🛍 مشتريات │  └─────────────┘  └────────────────────┘ │
│ 💰 حسابات  │                                          │
│ 👥 موظفين  │  [أكثر المنتجات مبيعًا]  [تنبيهات ذكية]    │
│ 📊 تقارير  │                                          │
│ ⚙ إعدادات │                                          │
└──────────┴──────────────────────────────────────────┘
```

### 14.3 شاشة نقطة البيع (POS)
```
┌────────────────────────────┬───────────────────────┐
│  [بحث/باركود.......🔍]      │  سلة الحالي            │
│                             │  ─────────────────    │
│  [منتج]  [منتج]  [منتج]     │  منتج 1   ×2   50 ج.م  │
│  [منتج]  [منتج]  [منتج]     │  منتج 2   ×1   20 ج.م  │
│  [منتج]  [منتج]  [منتج]     │  ─────────────────    │
│  (شبكة أيقونات كبيرة        │  الإجمالي: 70 ج.م      │
│   بالصورة والسعر)           │  الضريبة:  10 ج.م      │
│                             │  الصافي:   80 ج.م      │
│  [تصنيفات: الكل|مشروبات|..] │                        │
│                             │  [نقدي] [بطاقة] [آجل]  │
│                             │  [    تأكيد البيع    ] │
└────────────────────────────┴───────────────────────┘
```

### 14.4 شاشة قائمة (مثال: المنتجات / الفواتير / العملاء - نمط موحّد)
```
┌────────────────────────────────────────────────┐
│  العنوان          [+ إضافة جديد]  [تصدير ⬇]       │
│  [بحث......] [فلتر: تصنيف ▾] [فلتر: تاريخ ▾]        │
├────────────────────────────────────────────────┤
│  # | صورة | الاسم | الكود | السعر | الكمية | إجراءات │
│  ...........................................    │
├────────────────────────────────────────────────┤
│               ترقيم الصفحات (Pagination)          │
└────────────────────────────────────────────────┘
```

### 14.5 شاشة الإعدادات العامة
```
تبويبات: [بيانات الشركة] [المظهر] [الفواتير والترقيم] [اللغة] [النسخ الاحتياطي] [المستخدمون]

تبويب "بيانات الشركة":
[رفع الشعار 🖼] [اسم الشركة....] [العنوان....]
[الهاتف....]    [البريد....]    [الرقم الضريبي....]

تبويب "المظهر":
[اختيار اللون الرئيسي: 🔵🟣🟢🟠]   [الوضع الافتراضي: ☀ نهاري / 🌙 ليلي / تلقائي]
```

---

## 15. معايير التسمية وكتابة الكود (Coding & Naming Standards)

- أسماء الجداول: `snake_case` وبصيغة الجمع (`products`, `sales_invoices`)
- أسماء الأعمدة: `snake_case`
- أسماء المكونات (Components) في React: `PascalCase` (مثال: `ProductCard.jsx`)
- أسماء الدوال والمتغيرات في JS: `camelCase`
- كل وحدة (Module) لها: `pages/` (صفحات كاملة) + `components/` (مكونات فرعية) + `api.js` (استدعاءات IPC) + `hooks/` (منطق مخصص)
- لا يُكتب أي نص ظاهر للمستخدم مباشرة في الكود — يُمرّ دائمًا عبر ملفات الترجمة (`locales/ar.json` و `en.json`)
- كل عملية حذف هي **Soft Delete** (`is_deleted = true`) وليست حذفًا فعليًا من القاعدة، إلا في شاشات إدارية خاصة توضّح ذلك صراحة
- أي عملية مالية أو مخزنية حساسة (إنشاء فاتورة، تسوية مخزون، قيد محاسبي) تُنفَّذ داخل **Transaction** واحدة مع Rollback عند الفشل

---

## 16. تدفق البيانات بين Electron و React (IPC Architecture)

```
[واجهة React] --(window.api.invoke)--> [preload.js: contextBridge]
      --(ipcRenderer.invoke)--> [main.js: ipcMain.handle]
      --> [ipc/*.ipc.js] --> [services/*.service.js] --> [repositories/*.repository.js]
      --> [database/db.js (SQLite)]
      <-- نتيجة JSON <-- ... <-- ... <-- ...
```

- **لا يوجد أي اتصال مباشر** من React بقاعدة البيانات — كل شيء يمر عبر `preload.js` بأسلوب آمن (`contextIsolation: true`, `nodeIntegration: false`)
- كل استجابة IPC بصيغة موحّدة: `{ success: boolean, data | error }`
- الطباعة والتعامل مع الأجهزة (طابعة/باركود/درج) تتم فقط من Main Process عبر طبقة `hardware/`، وليس من الواجهة مباشرة

---

## 17. معايير القبول لكل وحدة (Definition of Done)

كل وحدة تُعتبر مكتملة عند توفر:
- [ ] شاشة قائمة (List) مع بحث + فلاتر + ترقيم صفحات + تصدير Excel/PDF
- [ ] نموذج إضافة/تعديل مع تحقق من صحة البيانات (Validation) ورسائل خطأ واضحة بالعربي/الإنجليزي
- [ ] صلاحيات مطبّقة فعليًا (إخفاء/تعطيل الأزرار حسب دور المستخدم) وليس فقط في الواجهة، بل تحقق في الـ IPC أيضًا (Defense in Depth)
- [ ] تسجيل العملية في `audit_logs`
- [ ] توافق كامل مع الوضع الليلي/النهاري ومع اتجاه RTL/LTR
- [ ] اختبار يدوي بسيناريوهات حقيقية (بيانات كثيرة، قيم فارغة، أخطاء إدخال)

---

## 18. ملخص شامل نهائي

هذا المستند يمثل **مواصفة متكاملة (Full Specification)** لبناء نظام ERP سطح مكتب باستخدام Vite.js + React + Electron + SQLite، شاملاً: التصميم، الوحدات الوظيفية، قاعدة البيانات، هيكلة المشروع، معايير الكود، تدفق البيانات، ومعايير القبول. أي منصة أو فريق تنفيذ يلتزم بهذا المستند حرفيًا يضمن مخرجًا متسقًا مع الرؤية الموضوعة، مع ترك مساحة مدروسة للتوسع المستقبلي (فروع متعددة، خادم مركزي، تحديث تلقائي) دون إعادة هيكلة جذرية.
