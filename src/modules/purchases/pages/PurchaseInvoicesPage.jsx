import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FilePlus2, HandCoins, Plus, Printer, Search, Trash2, Truck } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useSettings } from "../../../context/SettingsContext";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Pagination from "../../../components/ui/Pagination";
import Table from "../../../components/ui/Table";

const accountingDirectory = {
  SA: {
    name: 'الدليل المحاسبي السعودي',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية وما في حكمها', type: 'asset' },
          { code: '112', name: 'الاستثمارات قصيرة الأجل', type: 'asset' },
          { code: '113', name: 'الحسابات المدينة', type: 'asset' },
          { code: '114', name: 'المخزون', type: 'asset' },
          { code: '115', name: 'المصروفات المدفوعة مقدماً', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
          { code: '123', name: 'الاستثمارات طويلة الأجل', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'الأوراق الدائنة', type: 'liability' },
          { code: '213', name: 'المستحقات المستحقة', type: 'liability' },
          { code: '214', name: 'الإيرادات المقدمة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
          { code: '222', name: 'السندات', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
        { code: '43', name: 'إيرادات أخرى', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات البيع والتسويق', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية وعمومية', type: 'expense' },
        { code: '54', name: 'مصروفات تمويلية', type: 'expense' },
        { code: '55', name: 'مصروفات أخرى', type: 'expense' },
      ]},
    ],
  },
  EG: {
    name: 'الدليل المحاسبي المصري',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'الصندوق والبنوك', type: 'asset' },
          { code: '112', name: 'الأوراق المالية', type: 'asset' },
          { code: '113', name: 'العملاء', type: 'asset' },
          { code: '114', name: 'المخازن', type: 'asset' },
          { code: '115', name: 'المصروفات المقدمة', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول الثابتة', type: 'asset', children: [
          { code: '121', name: 'الأراضي والمباني', type: 'asset' },
          { code: '122', name: 'المعدات والآلات', type: 'asset' },
          { code: '123', name: 'وسائل النقل', type: 'asset' },
          { code: '124', name: 'الأثاث والتجهيزات', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الموردون', type: 'liability' },
          { code: '212', name: 'الأوراق الدائنة', type: 'liability' },
          { code: '213', name: 'الدائنون الآخرون', type: 'liability' },
          { code: '214', name: 'المستحقات الحكومية', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم طويلة الأجل', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطي القانوني', type: 'equity' },
        { code: '33', name: 'الأرباح المرحلة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'صافي المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
        { code: '43', name: 'إيرادات متنوعة', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة المبيعات', type: 'expense' },
        { code: '52', name: 'مصروفات بيعية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
        { code: '54', name: 'مصروفات تمويلية', type: 'expense' },
      ]},
    ],
  },
  AE: {
    name: 'الدليل المحاسبي الإماراتي',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية والبنوك', type: 'asset' },
          { code: '112', name: 'الاستثمارات قصيرة الأجل', type: 'asset' },
          { code: '113', name: 'الحسابات المدينة', type: 'asset' },
          { code: '114', name: 'المخزون', type: 'asset' },
          { code: '115', name: 'المصروفات المدفوعة مقدماً', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
          { code: '123', name: 'الاستثمارات طويلة الأجل', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
          { code: '213', name: 'الإيرادات المقدمة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
        { code: '43', name: 'إيرادات أخرى', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
        { code: '54', name: 'مصروفات تمويلية', type: 'expense' },
      ]},
    ],
  },
  BH: {
    name: 'الدليل المحاسبي البحريني',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية وما في حكمها', type: 'asset' },
          { code: '112', name: 'الحسابات المدينة', type: 'asset' },
          { code: '113', name: 'المخزون', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
      ]},
    ],
  },
  OM: {
    name: 'الدليل المحاسبي العماني',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية والبنوك', type: 'asset' },
          { code: '112', name: 'الحسابات المدينة', type: 'asset' },
          { code: '113', name: 'المخزون', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
      ]},
    ],
  },
  KW: {
    name: 'الدليل المحاسبي الكويتي',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية وما في حكمها', type: 'asset' },
          { code: '112', name: 'الحسابات المدينة', type: 'asset' },
          { code: '113', name: 'المخزون', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
      ]},
    ],
  },
  QA: {
    name: 'الدليل المحاسبي القطري',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية والبنوك', type: 'asset' },
          { code: '112', name: 'الحسابات المدينة', type: 'asset' },
          { code: '113', name: 'المخزون', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
      ]},
    ],
  },
};

const PurchaseInvoicesPage = () => {
  const { currentBranch, settings } = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [options, setOptions] = useState({
    suppliers: [],
    products: [],
    warehouses: [],
  });
  const [taxRules, setTaxRules] = useState([]);
  const [selectedTaxRuleIds, setSelectedTaxRuleIds] = useState([]);
  const [taxValues, setTaxValues] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [paySaving, setPaySaving] = useState(false);

  const loadInvoices = useCallback(
    async (page = 1) => {
      setLoading(true);
      const response = await window.api?.purchases?.invoices({
        query,
        branch_id: currentBranch?.id || 1,
        page,
        limit: 10,
      });
      if (response?.success) setInvoices(response.data);
      else if (response?.error) toast.error(response.error);
      setLoading(false);
    },
    [currentBranch?.id, query, toast],
  );

  useEffect(() => {
    loadInvoices(1);
    window.api?.purchases?.options(currentBranch?.id || 1).then((response) => {
      if (response?.success) {
        setOptions(response.data);
        setWarehouseId(String(response.data.warehouses[0]?.id || ""));
      }
    });
    window.api?.taxes?.list({
      countryCode: settings?.tax_country_code || "SA",
      transactionType: "purchase",
    }).then((response) => {
      if (response?.success) {
        setTaxRules(response.data);
        setSelectedTaxRuleIds(response.data.map((rule) => rule.id));
        setTaxValues(Object.fromEntries(response.data.map((rule) => [rule.id, { rate: rule.rate, value: '' }])));
      }
    });
  }, [currentBranch?.id, loadInvoices, settings?.tax_country_code]);

  const selectedProduct = options.products.find(
    (product) => String(product.id) === String(productId),
  );
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.unit_cost, 0),
    [cart],
  );
  const getTaxValue = (rule) => {
    const configured = taxValues[rule.id];
    if (configured?.value !== undefined && configured.value !== "") return Number(configured.value || 0);
    return subtotal * (Number((configured?.rate ?? rule.rate) || 0) / 100);
  };
  const tax = settings?.tax_enabled
    ? taxRules
        .filter((rule) => selectedTaxRuleIds.includes(rule.id))
        .reduce((sum, rule) => sum + (rule.calculation_method === "withholding" ? -1 : 1) * getTaxValue(rule), 0)
    : 0;
  const total = subtotal + tax;

  // ضريبة الخصم والإضافة تُحدد تلقائياً من تصنيف المورد (تُخصم عند السداد)،
  // وتُلغى تماماً لو كان مسجلاً في نظام الدفعات المقدمة.
  const selectedSupplier = options.suppliers.find(
    (supplier) => String(supplier.id) === String(supplierId),
  );
  const supplierWhtRate =
    selectedSupplier && Number(selectedSupplier.is_advance_payment_exempt) !== 1
      ? Number(
          options.withholdingCategories.find(
            (cat) => cat.tax_code === selectedSupplier.withholding_category,
          )?.rate_percentage ?? 0,
        )
      : 0;
  const whtPreview = supplierWhtRate > 0 ? total * (supplierWhtRate / 100) : 0;
  const netPayable = total - whtPreview;

  // معاينة الخصم على فاتورة قيد التحصيل (نفس منطق الخادم):
  // المورد المعفى لا يُخصم إطلاقاً، وإلا فنسبة تصنيفه.
  const payPreview = useMemo(() => {
    if (!paying) return { rate: 0, wht: 0, net: 0, remaining: 0 };
    const remaining = Number(paying.remaining_amount || 0);
    const code = paying.withholding_tax_code || paying.withholding_category;
    const category = options.withholdingCategories.find((cat) => cat.tax_code === code);
    const rate =
      Number(paying.is_advance_payment_exempt) === 1
        ? 0
        : Number(category?.rate_percentage ?? 0);
    const wht = remaining * (rate / 100);
    return { rate, wht, net: remaining - wht, remaining };
  }, [paying, options.withholdingCategories]);

  const openPay = (invoice) => {
    setPaying(invoice);
    setPayAmount("");
    setPayMethod("cash");
  };
  const submitPay = async (event) => {
    event.preventDefault();
    if (!paying) return;
    const amount = payAmount === "" ? payPreview.net : Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0)
      return toast.error("مبلغ السداد يجب أن يكون أكبر من صفر");
    if (amount > payPreview.net + 0.01)
      return toast.error(
        `لا يمكن سداد أكثر من الصافي المستحق بعد الضريبة (${payPreview.net.toFixed(2)})`,
      );
    setPaySaving(true);
    const response = await window.api?.purchases?.collectPayment({
      invoice_id: paying.id,
      amount,
      payment_method: payMethod,
      created_by: user?.id,
    });
    if (response?.success) {
      toast.success(response.message);
      setPaying(null);
      loadInvoices(invoices.page);
    } else toast.error(response?.error || "تعذر تسديد الفاتورة");
    setPaySaving(false);
  };
  const addToCart = () => {
    if (!selectedProduct || Number(quantity) <= 0) return;
    const cost = Number(
      unitCost === "" ? selectedProduct.cost_price : unitCost,
    );
    setCart((current) => [
      ...current,
      {
        product_id: selectedProduct.id,
        name: selectedProduct.name,
        qty: Number(quantity),
        unit_cost: cost,
      },
    ]);
    setProductId("");
    setQuantity(1);
    setUnitCost("");
  };
  const createInvoice = async (event) => {
    event.preventDefault();
    if (!supplierId || !cart.length)
      return toast.error("اختر المورد وأضف صنفاً واحداً على الأقل");
    setSaving(true);
    const response = await window.api.purchases.createInvoice({
      branch_id: currentBranch?.id || 1,
      supplier_id: Number(supplierId),
      warehouse_id: Number(warehouseId),
      items: cart,
      paid_amount: Number(paidAmount || 0),
      tax_rule_ids: selectedTaxRuleIds,
      tax_overrides: selectedTaxRuleIds.map((id) => ({ id, rate: taxValues[id]?.rate, value: taxValues[id]?.value === '' ? undefined : taxValues[id]?.value })),
      created_by: user?.id,
    });
    if (response?.success) {
      toast.success(response.message);
      setModalOpen(false);
      setCart([]);
      loadInvoices(1);
    } else toast.error(response?.error || "تعذر إنشاء فاتورة الشراء");
    setSaving(false);
  };
  const printInvoice = async (invoice) => {
    const response = await window.api?.hardware?.printReceipt({
      invoice,
      settings,
      branch: currentBranch,
    });
    if (response?.success) toast.success("تم إرسال الفاتورة للطباعة");
    else toast.error(response?.error || "تعذر إرسال الفاتورة للطباعة");
  };
  const columns = [
    {
      key: "invoice_number",
      header: "رقم الفاتورة",
      render: (value) => <strong>{value}</strong>,
    },
    { key: "supplier_name", header: "المورد" },
    { key: "date", header: "التاريخ" },
    {
      key: "payment_status",
      header: "الحالة",
      render: (value) => (
        <span
          style={{
            color: value === "paid" ? "#10b981" : "#f59e0b",
            fontWeight: 700,
          }}
        >
          {value === "paid" ? "مدفوعة" : value === "partial" ? "جزئية" : "آجلة"}
        </span>
      ),
    },
    {
      key: "tax_details",
      header: "الضرائب",
      render: (value, row) => {
        let details = [];
        try {
          details = JSON.parse(value || "[]");
        } catch {
          details = [];
        }
        return (
          <div>
            <strong>{Number(row.tax_amount || 0).toFixed(2)}</strong>
            {details.map((tax, index) => (
              <div
                key={`${tax.short_name}-${index}`}
                style={{ color: "var(--text-muted)", fontSize: 11 }}
              >
                {tax.name} ({tax.rate}%)
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "total",
      header: "الإجمالي",
      align: "end",
      render: (value) => Number(value || 0).toFixed(2),
    },
    {
      key: "remaining_amount",
      header: "المتبقي",
      align: "end",
      render: (value) => (
        <strong style={{ color: Number(value) > 0 ? "#d97706" : "#10b981" }}>
          {Number(value || 0).toFixed(2)}
        </strong>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      render: (_, row) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          {Number(row.remaining_amount) > 0 && (
            <Button
              size="sm"
              icon={HandCoins}
              onClick={() => openPay(row)}
              title="سداد الفاتورة"
            >
              سداد
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon={Printer}
            onClick={() => printInvoice(row)}
            title="طباعة الفاتورة"
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}
          >
            فواتير المشتريات
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            تسجيل المشتريات وزيادة المخزون تلقائياً
          </p>
        </div>
        <Button icon={FilePlus2} onClick={() => setModalOpen(true)}>
          فاتورة شراء جديدة
        </Button>
      </div>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <Input
            icon={Search}
            placeholder="ابحث برقم الفاتورة أو اسم المورد"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span
            style={{
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              fontSize: 13,
            }}
          >
            {invoices.total} فاتورة
          </span>
        </div>
        <Table
          columns={columns}
          data={invoices.items}
          loading={loading}
          emptyMessage="لا توجد فواتير مشتريات"
        />
        <Pagination
          currentPage={invoices.page}
          totalPages={invoices.totalPages}
          totalItems={invoices.total}
          onPageChange={loadInvoices}
        />
      </Card>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="إنشاء فاتورة شراء"
        maxWidth="900px"
      >
        <form onSubmit={createInvoice} style={{ display: "grid", gap: 16 }}>
          <div style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 12, color: "var(--text-main)" }}>
            <strong>الضرائب المطبقة على الفاتورة</strong>
            {taxRules.map((rule) => (
              <label key={rule.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13 }}>
                <input type="checkbox" checked={selectedTaxRuleIds.includes(rule.id)} onChange={() => setSelectedTaxRuleIds((current) => current.includes(rule.id) ? current.filter((id) => id !== rule.id) : [...current, rule.id])} />
                <span style={{ minWidth: 180 }}>{rule.name}</span>
                <input type="number" min="0" step="0.01" value={taxValues[rule.id]?.rate ?? rule.rate} onChange={(event) => setTaxValues((current) => ({ ...current, [rule.id]: { ...current[rule.id], rate: event.target.value } }))} style={{ width: 80, padding: "6px 8px", border: "1px solid var(--border-color)", borderRadius: 6 }} />%
                <input type="number" min="0" step="0.01" value={taxValues[rule.id]?.value || getTaxValue(rule).toFixed(2)} onChange={(event) => setTaxValues((current) => ({ ...current, [rule.id]: { ...current[rule.id], value: event.target.value } }))} style={{ width: 100, padding: "6px 8px", border: "1px solid var(--border-color)", borderRadius: 6 }} />
              </label>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              المورد
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 10,
                  background: "var(--bg-surface)",
                  color: "var(--text-main)",
                }}
              >
                <option value="">اختر المورد</option>
                {options.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              المستودع
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 10,
                  background: "var(--bg-surface)",
                  color: "var(--text-main)",
                }}
              >
                {options.warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px 130px auto",
              gap: 10,
              alignItems: "end",
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              الصنف
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 10,
                  background: "var(--bg-surface)",
                  color: "var(--text-main)",
                }}
              >
                <option value="">اختر صنفاً</option>
                {options.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="الكمية"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              label="سعر التكلفة"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              placeholder={selectedProduct?.cost_price?.toString()}
              onChange={(e) => setUnitCost(e.target.value)}
            />
            <Button type="button" icon={Plus} onClick={addToCart}>
              إضافة
            </Button>
          </div>
          <div
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {cart.length ? (
              cart.map((item, index) => (
                <div
                  key={`${item.product_id}-${index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 120px 40px",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--text-main)",
                  }}
                >
                  <span>{item.name}</span>
                  <span>
                    {item.qty} × {item.unit_cost.toFixed(2)}
                  </span>
                  <strong style={{ textAlign: "end" }}>
                    {(item.qty * item.unit_cost).toFixed(2)}
                  </strong>
                  <Button
                    type="button"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() =>
                      setCart((current) =>
                        current.filter((_, lineIndex) => lineIndex !== index),
                      )
                    }
                    style={{ color: "#ef4444" }}
                  />
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: 30,
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                لم تتم إضافة أصناف بعد
              </div>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            <Input
              label="المدفوع"
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "end",
                gap: 5,
              }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                الإجمالي شامل الضريبة
              </span>
              <strong style={{ color: "var(--primary-color)", fontSize: 22 }}>
                {total.toFixed(2)}
              </strong>
            </div>
          </div>
          {selectedSupplier &&
            (supplierWhtRate > 0 ||
              Number(selectedSupplier.is_advance_payment_exempt) === 1) && (
              <div
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gap: 8,
                  color: "var(--text-main)",
                  background:
                    Number(selectedSupplier.is_advance_payment_exempt) === 1
                      ? "#f5f3ff"
                      : undefined,
                }}
              >
                {Number(selectedSupplier.is_advance_payment_exempt) === 1 ? (
                  <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 700 }}>
                    هذا المورد مسجّل في نظام الدفعات المقدمة — لن تُخصم ضريبة الخصم
                    والإضافة من فواتيره إطلاقاً
                  </span>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                      }}
                    >
                      <span>
                        ضريبة الخصم والإضافة ({supplierWhtRate}%) — تُخصم عند السداد
                      </span>
                      <strong style={{ color: "#ef4444" }}>
                        -{whtPreview.toFixed(2)}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        الصافي المستحق للمورد
                      </span>
                      <strong
                        style={{ color: "var(--primary-color)", fontSize: 20 }}
                      >
                        {netPayable.toFixed(2)}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" icon={Truck} loading={saving}>
              حفظ فاتورة الشراء
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={Boolean(paying)}
        onClose={() => setPaying(null)}
        title="سداد فاتورة شراء"
        subtitle={
          paying
            ? `${paying.invoice_number} — ${paying.supplier_name}`
            : ""
        }
        maxWidth="520px"
      >
        <form onSubmit={submitPay} style={{ display: "grid", gap: 16 }}>
          {paying && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  payPreview.rate > 0
                    ? "repeat(3, minmax(0, 1fr))"
                    : "1fr",
                gap: 10,
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--text-muted)",
                  }}
                >
                  المبلغ الإجمالي
                </span>
                <strong style={{ color: "var(--text-main)" }}>
                  {payPreview.remaining.toFixed(2)}
                </strong>
              </div>
              {payPreview.rate > 0 && (
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: "var(--text-muted)",
                    }}
                  >
                    ضريبة الخصم والإضافة ({payPreview.rate}%)
                  </span>
                  <strong style={{ color: "#ef4444" }}>
                    -{payPreview.wht.toFixed(2)}
                  </strong>
                </div>
              )}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--text-muted)",
                  }}
                >
                  الصافي المستحق للمورد
                </span>
                <strong style={{ color: "var(--primary-color)" }}>
                  {payPreview.net.toFixed(2)}
                </strong>
              </div>
            </div>
          )}
          {paying && Number(paying.is_advance_payment_exempt) === 1 && (
            <span
              style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}
            >
              المورد مسجّل في نظام الدفعات المقدمة — لا يُخصم منه ضريبة الخصم
              والإضافة
            </span>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { id: "cash", label: "نقداً" },
              { id: "card", label: "بطاقة / تحويل" },
            ].map((option) => {
              const active = payMethod === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPayMethod(option.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: `1px solid ${active ? "var(--primary-color)" : "var(--border-color)"}`,
                    backgroundColor: active
                      ? "var(--primary-light)"
                      : "var(--bg-surface)",
                    color: active
                      ? "var(--primary-color)"
                      : "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <Input
            label="مبلغ السداد (الصافي بعد الضريبة)"
            type="number"
            min="0.01"
            step="0.01"
            max={payPreview.net}
            required
            autoFocus
            value={payAmount}
            placeholder={payPreview.net.toFixed(2)}
            onChange={(event) => setPayAmount(event.target.value)}
            helperText={`الصافي المستحق: ${payPreview.net.toFixed(2)}`}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPayAmount(payPreview.net.toFixed(2))}
            >
              سداد الصافي كاملاً
            </Button>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPaying(null)}
              >
                إلغاء
              </Button>
              <Button type="submit" icon={HandCoins} loading={paySaving}>
                تأكيد السداد
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseInvoicesPage;
