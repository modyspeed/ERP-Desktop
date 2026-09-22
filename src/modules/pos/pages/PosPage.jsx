import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Armchair,
  Banknote,
  Delete,
  Grid2X2,
  LogOut,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import { useSettings } from "../../../context/SettingsContext";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";

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

const PosPage = () => {
  const { currentBranch, settings } = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [options, setOptions] = useState({ products: [], warehouses: [] });
  const [taxRules, setTaxRules] = useState([]);
  const [selectedTaxRuleIds, setSelectedTaxRuleIds] = useState([]);
  const [taxValues, setTaxValues] = useState({});
  const [warehouseId, setWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [table, setTable] = useState(null);
  const [posSession, setPosSession] = useState(null);

  const loadPosSession = useCallback(async () => {
    try {
      const response = await window.api?.pos?.activeSession({ cashier_id: user?.id });
      if (response?.success) setPosSession(response.data);
      else setPosSession(null);
    } catch {
      setPosSession(null);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPosSession();
  }, [loadPosSession]);

  useEffect(() => {
    const stateTable = location.state?.table;
    const queryTableId = Number(new URLSearchParams(location.search).get("table") || 0);

    if (stateTable?.id) {
      setTable({ id: Number(stateTable.id), number: stateTable.number });
      return;
    }
    if (!queryTableId) {
      setTable(null);
      return;
    }
    window.api?.tables
      ?.list({ branch_id: currentBranch?.id || 1 })
      .then((response) => {
        const found = response?.data?.find((item) => item.id === queryTableId);
        if (found) setTable({ id: found.id, number: found.table_number });
      });
  }, [location.state, location.search, currentBranch?.id]);

  const exitTableMode = () => {
    setTable(null);
    navigate("/pos", { replace: true });
  };

  useEffect(() => {
    window.api?.sales?.options(currentBranch?.id || 1).then((response) => {
      if (response?.success) {
        setOptions(response.data);
        setWarehouseId(String(response.data.warehouses[0]?.id || ""));
      }
    });
    window.api?.taxes
      ?.list({
        countryCode: settings?.tax_country_code || "SA",
        transactionType: "sale",
      })
      .then((response) => {
        if (response?.success) {
          setTaxRules(response.data);
          setSelectedTaxRuleIds(response.data.map((rule) => rule.id));
          setTaxValues(Object.fromEntries(response.data.map((rule) => [rule.id, { rate: rule.rate, value: '' }])));
        }
      });
  }, [currentBranch?.id, settings?.tax_country_code]);

  const visibleProducts = options.products
    .filter((product) =>
      `${product.name} ${product.barcode || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .slice(0, 24);
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.unit_price, 0),
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
  const paid = paidAmount === "" ? total : Number(paidAmount || 0);
  const change = Math.max(0, paid - total);

  const addProduct = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing)
        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      return [
        ...current,
        {
          product_id: product.id,
          name: product.name,
          qty: 1,
          unit_price: Number(product.sale_price || 0),
        },
      ];
    });
  };
  const adjustQuantity = (id, amount) =>
    setCart((current) =>
      current
        .map((item) =>
          item.product_id === id ? { ...item, qty: item.qty + amount } : item,
        )
        .filter((item) => item.qty > 0),
    );

  const completeSale = async () => {
    if (!cart.length) return toast.error("أضف صنفاً إلى السلة أولاً");
    if (paid < total) return toast.error("المبلغ المدفوع أقل من الإجمالي");
    setSaving(true);
    const response = await window.api.sales.createInvoice({
      branch_id: currentBranch?.id || 1,
      warehouse_id: Number(warehouseId),
      items: cart,
      paid_amount: total,
      tax_rule_ids: selectedTaxRuleIds,
      tax_overrides: selectedTaxRuleIds.map((id) => ({ id, rate: taxValues[id]?.rate, value: taxValues[id]?.value === '' ? undefined : taxValues[id]?.value })),
      invoice_type: "cash",
      source: "pos",
      table_id: table?.id || null,
      pos_session_id: posSession?.id || null,
      created_by: user?.id,
    });
    if (response?.success) {
      toast.success(`تمت عملية البيع ${response.data.invoice_number}`);
      if (table) toast.info(`${t('pos.tableFreed')}: ${t('tables.tableNumber')} ${table.number}`);
      await window.api.hardware.openCashDrawer();
      await window.api.hardware.printReceipt({
        invoice: response.data,
        settings,
        branch: currentBranch,
      });
      setCart([]);
      setPaidAmount("");
      setSearch("");
      setTable(null);
      loadPosSession();
      navigate("/pos", { replace: true });
    } else toast.error(response?.error || "تعذر إتمام عملية البيع");
    setSaving(false);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 390px",
        gap: 18,
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <Card style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--text-main)",
              }}
            >
              {t("pos.title")}
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
              {t("pos.subtitle")}
            </p>
          </div>
          {table && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginInlineStart: "auto",
                padding: "6px 10px 6px 12px",
                borderRadius: 9999,
                border: "1px solid #d97706",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Armchair size={15} />
              <span>{`${t("tables.tableNumber")} ${table.number}`}</span>
              <button
                onClick={exitTableMode}
                title={t("pos.exitTable")}
                style={{
                  display: "grid",
                  placeItems: "center",
                  padding: 2,
                  border: "none",
                  borderRadius: 9999,
                  background: "rgba(146, 64, 14, 0.12)",
                  color: "#92400e",
                  cursor: "pointer",
                }}
              >
                <X size={13} />
              </button>
            </div>
          )}
          {posSession && (
            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              onClick={() => navigate("/pos/session")}
              title={t("pos.closeSession")}
            >
              {t("pos.closeSession")}
            </Button>
          )}
          <div style={{ marginInlineStart: table ? 0 : "auto", minWidth: 180 }}>
            <Input
              icon={Search}
              autoFocus
              placeholder={t("pos.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 12,
            overflowY: "auto",
          }}
        >
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addProduct(product)}
              style={{
                textAlign: "start",
                padding: 14,
                minHeight: 110,
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                background: "var(--bg-surface)",
                color: "var(--text-main)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--primary-light)",
                  color: "var(--primary-color)",
                  marginBottom: 10,
                }}
              >
                <Grid2X2 size={17} />
              </div>
              <strong style={{ display: "block", marginBottom: 6 }}>
                {product.name}
              </strong>
              <span style={{ color: "var(--primary-color)", fontWeight: 700 }}>
                {Number(product.sale_price || 0).toFixed(2)}
              </span>
              <span
                style={{
                  display: "block",
                  color: "var(--text-muted)",
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                المتاح: {product.stock_quantity}
              </span>
            </button>
          ))}
        </div>
      </Card>
      <Card style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h2 style={{ fontSize: 17, color: "var(--text-main)" }}>
            <ShoppingCart
              size={18}
              style={{ verticalAlign: "middle", marginInlineEnd: 7 }}
            />
            السلة ({cart.length})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={Delete}
            onClick={() => setCart([])}
          >
            تفريغ
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {cart.length ? (
            cart.map((item) => (
              <div
                key={item.product_id}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    color: "var(--text-main)",
                  }}
                >
                  <strong>{item.name}</strong>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => adjustQuantity(item.product_id, -item.qty)}
                    style={{ color: "#ef4444" }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    {(item.qty * item.unit_price).toFixed(2)}
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Minus}
                      onClick={() => adjustQuantity(item.product_id, -1)}
                    />
                    <strong>{item.qty}</strong>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={() => adjustQuantity(item.product_id, 1)}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                padding: 40,
              }}
            >
              <ShoppingCart size={32} />
              <p style={{ marginTop: 10 }}>السلة فارغة</p>
            </div>
          )}
        </div>
        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ border: "1px solid var(--border-color)", borderRadius: 10, padding: 10, color: "var(--text-main)" }}>
            <strong style={{ fontSize: 13 }}>الضرائب المطبقة على الفاتورة</strong>
            {taxRules.map((rule) => (
              <label key={rule.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, fontSize: 12 }}>
                <input type="checkbox" checked={selectedTaxRuleIds.includes(rule.id)} onChange={() => setSelectedTaxRuleIds((current) => current.includes(rule.id) ? current.filter((id) => id !== rule.id) : [...current, rule.id])} />
                <span style={{ minWidth: 140 }}>{rule.name}</span>
                <input type="number" min="0" step="0.01" value={taxValues[rule.id]?.rate ?? rule.rate} onChange={(event) => setTaxValues((current) => ({ ...current, [rule.id]: { ...current[rule.id], rate: event.target.value } }))} style={{ width: 64, padding: "5px 6px", border: "1px solid var(--border-color)", borderRadius: 6 }} />%
                <input type="number" min="0" step="0.01" value={taxValues[rule.id]?.value || getTaxValue(rule).toFixed(2)} onChange={(event) => setTaxValues((current) => ({ ...current, [rule.id]: { ...current[rule.id], value: event.target.value } }))} style={{ width: 80, padding: "5px 6px", border: "1px solid var(--border-color)", borderRadius: 6 }} />
              </label>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--text-muted)",
            }}
          >
            <span>الإجمالي</span>
            <strong style={{ color: "var(--text-main)", fontSize: 20 }}>
              {total.toFixed(2)}
            </strong>
          </div>
          <Input
            label="المبلغ المدفوع"
            type="number"
            min={total}
            step="0.01"
            value={paidAmount}
            placeholder={total.toFixed(2)}
            onChange={(e) => setPaidAmount(e.target.value)}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#10b981",
              fontSize: 13,
            }}
          >
            <span>الباقي</span>
            <strong>{change.toFixed(2)}</strong>
          </div>
          <Button
            size="lg"
            icon={Banknote}
            loading={saving}
            onClick={completeSale}
          >
            إتمام البيع
          </Button>
          <Button
            variant="secondary"
            icon={Printer}
            onClick={() => window.api?.hardware?.openCashDrawer()}
          >
            فتح درج النقود
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PosPage;
