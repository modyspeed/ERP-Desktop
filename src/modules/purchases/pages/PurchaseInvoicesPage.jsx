import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FilePlus2, Plus, Printer, Search, Trash2, Truck } from "lucide-react";
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
      key: "print",
      header: "",
      align: "end",
      render: (_, row) => (
        <Button
          size="sm"
          variant="ghost"
          icon={Printer}
          onClick={() => printInvoice(row)}
          title="طباعة الفاتورة"
        />
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
    </div>
  );
};

export default PurchaseInvoicesPage;
