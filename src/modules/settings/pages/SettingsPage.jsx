import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../theme/ThemeProvider';
import { useToast } from '../../../context/ToastContext';
import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Table from '../../../components/ui/Table';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import {
  Building2,
  Palette,
  FileSpreadsheet,
  Network,
  Cpu,
  Upload,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
  Landmark,
  WandSparkles,
} from 'lucide-react';

const currencyOptions = [
  { code: 'SAR', name: 'ريال سعودي' },
  { code: 'EGP', name: 'جنيه مصري' },
  { code: 'AED', name: 'درهم إماراتي' },
  { code: 'KWD', name: 'دينار كويتي' },
  { code: 'QAR', name: 'ريال قطري' },
  { code: 'BHD', name: 'دينار بحريني' },
  { code: 'USD', name: 'دولار أمريكي' },
  { code: 'EUR', name: 'يورو' },
];

const taxCountryOptions = [
  { code: 'SA', name: 'السعودية', rate: 15 },
  { code: 'EG', name: 'مصر', rate: 14 },
  { code: 'AE', name: 'الإمارات', rate: 5 },
  { code: 'BH', name: 'البحرين', rate: 10 },
  { code: 'OM', name: 'عُمان', rate: 5 },
  { code: 'KW', name: 'الكويت', rate: 5 },
  { code: 'QA', name: 'قطر', rate: 0 },
];

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

const businessTypeOptions = [
  { value: 'retail_wholesale' },
  { value: 'manufacturing' },
  { value: 'restaurants_cafes' },
  { value: 'services_projects' },
  { value: 'pharmacies' },
  { value: 'rental' },
  { value: 'general' },
];

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { settings, branches, updateSettings, uploadLogo, refreshBranches, refreshSettings } = useSettings();
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode, themeColor, setThemeColor, themeColors, setFontFamily } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [accountingCatalogs, setAccountingCatalogs] = useState([]);
  const [selectedAccountingCatalog, setSelectedAccountingCatalog] = useState('');
  const [accountingCatalogModalOpen, setAccountingCatalogModalOpen] = useState(false);
  const [accountingCatalogForm, setAccountingCatalogForm] = useState({ name: '', description: '' });
  const [taxRules, setTaxRules] = useState([]);
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [fonts, setFonts] = useState([]);
  const [coaTemplates, setCoaTemplates] = useState([]);
  const [selectedCoaTemplate, setSelectedCoaTemplate] = useState('');
  const [taxTypeCatalog, setTaxTypeCatalog] = useState([]);
  const [addTaxModalOpen, setAddTaxModalOpen] = useState(false);
  const [addTaxForm, setAddTaxForm] = useState({
    name: '',
    short_name: '',
    rate: 0,
    tax_type: 'vat',
    transaction_type: 'sale',
    effective_from: '',
    effective_to: '',
    is_default: false,
    is_enabled: true,
    notes: '',
  });

  // Form states
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    business_type: 'general',
    address: '',
    phone: '',
    email: '',
    tax_number: '',
  });

  const [invoicingForm, setInvoicingForm] = useState({
    currency_code: 'SAR',
    secondary_currency_code: '',
    exchange_rate: 1.0,
    tax_country_code: 'SA',
    country_code: 'SA',
    calendar_type: 'gregorian',
    date_format: 'dd/MM/yyyy',
    font_family: 'Cairo',
    tax_type: 'VAT',
    coa_template_code: '',
    invoice_prefix_sales: 'INV-',
    invoice_prefix_purchase: 'PO-',
    tax_percentage: 15.0,
    sales_tax_percentage: 15.0,
    purchase_tax_percentage: 15.0,
    tax_enabled: 1,
  });

  // Branch modal state
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
    isMainBranch: false,
    isActive: true,
  });
  const [deleteBranchId, setDeleteBranchId] = useState(null);

  const loadAccountingCatalogs = async () => {
    try {
      // Load COA templates from JSON files
      const coaTemplatesRes = await window.api.invoke('coa-templates:list');
      if (coaTemplatesRes.success) {
        setCoaTemplates(coaTemplatesRes.data);
        setAccountingCatalogs(coaTemplatesRes.data.map(t => ({
          id: t.id,
          name: t.name,
          country_code: t.country_code,
          accounts_count: t.accounts_count,
          is_active: t.is_active || false
        })));
        const suggestedTemplate = coaTemplatesRes.data.find(
          template => template.country_code?.toUpperCase() === invoicingForm.country_code.toUpperCase()
        );
        setSelectedCoaTemplate(current => current || suggestedTemplate?.id || '');
        setInvoicingForm(current => ({
          ...current,
          coa_template_code: current.coa_template_code || suggestedTemplate?.id || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load COA templates:', err);
    }
  };

  useEffect(() => { loadAccountingCatalogs(); }, []);

  useEffect(() => {
    if (!invoicingForm.country_code || !coaTemplates.length) return;

    const suggestedTemplate = coaTemplates.find(
      (template) => template.country_code?.toUpperCase() === invoicingForm.country_code.toUpperCase()
    );
    if (!suggestedTemplate) return;

    setSelectedCoaTemplate(suggestedTemplate.id);
    setInvoicingForm((current) => ({
      ...current,
      coa_template_code: suggestedTemplate.id,
    }));
  }, [invoicingForm.country_code, coaTemplates]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [countriesRes, currenciesRes, fontsRes] = await Promise.all([
          window.api.countries.list(),
          window.api.currencies.list(),
          window.api.fonts.list(),
        ]);
        if (countriesRes.success) setCountries(countriesRes.data);
        if (currenciesRes.success) setCurrencies(currenciesRes.data);
        if (fontsRes.success) setFonts(fontsRes.data);
        const taxTypesRes = await window.api?.taxes?.taxTypes?.();
        if (taxTypesRes?.success) setTaxTypeCatalog(taxTypesRes.data);
      } catch (err) {
        console.error('Failed to fetch lookups:', err);
      }
    };
    fetchLookups();
  }, []);

  // Load tax template when country changes
  useEffect(() => {
    if (invoicingForm.country_code) {
      loadTaxTemplate(invoicingForm.country_code);
    }
  }, [invoicingForm.country_code]);

  const loadTaxTemplate = async (countryCode) => {
    try {
      const response = await window.api.taxes.templates.load(countryCode);
      if (response?.success && response.data?.taxes) {
        // Auto-apply the tax template to tax_rates table
        const applyResponse = await window.api.taxes.templates.apply(countryCode);
        if (applyResponse?.success) {
          toast.success(`تم تحميل ضرائب ${countryCode.toUpperCase()} بنجاح`);
        }
        // Reload tax rules
        loadTaxRules(countryCode);
      }
    } catch (err) {
      console.error('Failed to load tax template:', err);
    }
  };

  const loadTaxRules = async (countryCode = invoicingForm.tax_country_code) => {
    const response = await window.api?.taxes?.list({ countryCode, includeDisabled: true });
    if (response?.success) setTaxRules(response.data);
  };

  useEffect(() => { loadTaxRules(); }, [invoicingForm.tax_country_code]);

  const updateTaxRule = async (rule, enabled) => {
    const response = await window.api?.taxes?.update({ id: rule.id, rate: rule.rate, is_enabled: enabled });
    if (response?.success) { toast.success(response.message); loadTaxRules(); }
    else toast.error(response?.error || 'تعذر تحديث الضريبة');
  };

  const createTaxRule = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!addTaxForm.name.trim()) {
      toast.error('اسم الضريبة مطلوب');
      return;
    }
    const response = await window.api?.taxes?.create({
      ...addTaxForm,
      country_code: invoicingForm.country_code,
      is_default: addTaxForm.is_default ? 1 : 0,
      is_enabled: addTaxForm.is_enabled ? 1 : 0,
    });
    if (response?.success) {
      toast.success(response.message);
      setAddTaxModalOpen(false);
      setAddTaxForm({ name: '', short_name: '', rate: 0, tax_type: 'vat', transaction_type: 'sale', effective_from: '', effective_to: '', is_default: false, is_enabled: true, notes: '' });
      loadTaxRules(invoicingForm.country_code);
    } else {
      toast.error(response?.error || 'تعذر إضافة الضريبة');
    }
  };

  const deleteTaxRule = async (rule) => {
    if (!window.confirm(`هل أنت متأكد من حذف الضريبة "${rule.name}"؟ لا يمكن التراجع.`)) return;
    const response = await window.api?.taxes?.delete({ id: rule.id });
    if (response?.success) {
      toast.success(response.message);
      loadTaxRules(invoicingForm.country_code);
    } else {
      toast.error(response?.error || 'تعذر حذف الضريبة');
    }
  };

  const applyAccountingCatalog = async () => {
    if (!selectedCoaTemplate) return toast.error('اختر دليلاً محاسبياً أولاً');
    
    // Check if there are existing accounts
    const existingAccounts = await window.api.accounts.list({ limit: 1 });
    if (existingAccounts?.success && existingAccounts.data?.total > 0) {
      const confirmReplace = window.confirm(
        'يوجد بالفعل حسابات في الدليل المحاسبي. تطبيق قالب جديد قد يؤدي إلى تكرار الحسابات أو تعارضها. هل تريد المتابعة؟'
      );
      if (!confirmReplace) return;
    }
    
    const template = coaTemplates.find(t => t.id === selectedCoaTemplate);
    if (!template) return toast.error('القالب المحاسبي غير موجود');
    
    const response = await window.api.accounts.applyCatalogFromTemplate(template);
    if (response?.success) { 
      toast.success(response.message); 
      loadAccountingCatalogs(); 
    }
    else toast.error(response?.error || 'تعذر تطبيق الدليل المحاسبي');
  };

  const createAccountingCatalog = async (event) => {
    event.preventDefault();
    const response = await window.api.accounts.createCatalog({ ...accountingCatalogForm, country_code: 'CUSTOM' });
    if (response?.success) { toast.success(response.message); setAccountingCatalogModalOpen(false); loadAccountingCatalogs(); }
    else toast.error(response?.error || 'تعذر إنشاء الدليل المحاسبي');
  };

  // Initialize form values from settings
  useEffect(() => {
    if (settings) {
      setCompanyForm({
        company_name: settings.company_name || '',
        business_type: settings.business_type || 'general',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        tax_number: settings.tax_number || '',
      });

      setInvoicingForm({
        currency_code: settings.currency_code || 'SAR',
        secondary_currency_code: settings.secondary_currency_code || '',
        exchange_rate: settings.exchange_rate || 1.0,
        tax_country_code: settings.tax_country_code || 'SA',
        country_code: settings.country_code || 'SA',
        calendar_type: settings.calendar_type || 'gregorian',
        date_format: settings.date_format || 'dd/MM/yyyy',
        font_family: settings.font_family || 'Cairo',
        tax_type: settings.tax_type || 'VAT',
        coa_template_code: settings.coa_template_code || '',
        invoice_prefix_sales: settings.invoice_prefix_sales || 'INV-',
        invoice_prefix_purchase: settings.invoice_prefix_purchase || 'PO-',
        tax_percentage: settings.tax_percentage !== undefined ? settings.tax_percentage : 15.0,
        sales_tax_percentage: settings.sales_tax_percentage ?? settings.tax_percentage ?? 15.0,
        purchase_tax_percentage: settings.purchase_tax_percentage ?? settings.tax_percentage ?? 15.0,
        tax_enabled: settings.tax_enabled !== undefined ? settings.tax_enabled : 1,
      });
    }
  }, [settings]);

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(companyForm, user?.id);
      toast.success(t('common.saved'));
    } catch (err) {
      toast.error(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoicing = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(
        {
          ...invoicingForm,
          tax_percentage: Number(invoicingForm.sales_tax_percentage),
          sales_tax_percentage: Number(invoicingForm.sales_tax_percentage),
          purchase_tax_percentage: Number(invoicingForm.purchase_tax_percentage),
          tax_enabled: invoicingForm.tax_enabled ? 1 : 0,
        },
        user?.id
      );
      toast.success(t('common.saved'));
    } catch (err) {
      toast.error(err.message || 'فشل حفظ إعدادات الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await uploadLogo(file, user?.id);
      toast.success('تم تحديث شعار الشركة بنجاح');
    } catch (err) {
      toast.error(err.message || 'فشل رفع الشعار');
    } finally {
      setLoading(false);
    }
  };

  // Branch CRUD handlers
  const handleOpenBranchModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({
        name: branch.name,
        address: branch.address || '',
        phone: branch.phone || '',
        isMainBranch: !!branch.is_main_branch,
        isActive: !!branch.is_active,
      });
    } else {
      setEditingBranch(null);
      setBranchForm({
        name: '',
        address: '',
        phone: '',
        isMainBranch: false,
        isActive: true,
      });
    }
    setBranchModalOpen(true);
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      toast.error('اسم الفرع مطلوب');
      return;
    }

    try {
      setLoading(true);
      if (window.api?.branches) {
        const res = await window.api.branches.save({
          id: editingBranch?.id,
          ...branchForm,
          currentUserId: user?.id,
        });
        if (res.success) {
          toast.success(res.message || 'تم حفظ بيانات الفرع');
          setBranchModalOpen(false);
          refreshBranches();
        } else {
          toast.error(res.error);
        }
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الفرع');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!deleteBranchId) return;
    try {
      setLoading(true);
      if (window.api?.branches) {
        const res = await window.api.branches.delete({
          id: deleteBranchId,
          currentUserId: user?.id,
        });
        if (res.success) {
          toast.success('تم حذف الفرع بنجاح');
          setDeleteBranchId(null);
          refreshBranches();
        } else {
          toast.error(res.error);
        }
      }
    } catch (err) {
      toast.error(err.message || 'فشل حذف الفرع');
    } finally {
      setLoading(false);
    }
  };

  const tabsConfig = [
    { id: 'company', label: t('settings.companyTab'), icon: Building2 },
    { id: 'theme', label: t('settings.themeTab'), icon: Palette },
    { id: 'invoicing', label: t('settings.invoicingTab'), icon: FileSpreadsheet },
    { id: 'accounting', label: 'الدليل المحاسبي', icon: Landmark },
    { id: 'branches', label: t('settings.branchesTab'), icon: Network },
    { id: 'system', label: t('settings.systemTab'), icon: Cpu },
  ];

  const branchColumns = [
    { header: '#', key: 'id', width: '60px' },
    {
      header: t('settings.branchName'),
      key: 'name',
      render: (name, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700 }}>{name}</span>
          {row.is_main_branch ? (
            <Badge variant="primary">{t('common.mainBranch')}</Badge>
          ) : null}
        </div>
      ),
    },
    { header: t('settings.branchAddress'), key: 'address' },
    { header: t('settings.branchPhone'), key: 'phone' },
    {
      header: t('common.status'),
      key: 'is_active',
      render: (isActive) => (
        <Badge variant={isActive ? 'success' : 'default'} dot>
          {isActive ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      header: t('common.actions'),
      key: 'actions',
      align: 'end',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            onClick={() => handleOpenBranchModal(row)}
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
            title={t('common.edit')}
          >
            <Edit2 size={15} />
          </button>
          {!row.is_main_branch && (
            <button
              onClick={() => setDeleteBranchId(row.id)}
              style={{
                padding: '6px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: '#ef4444',
                cursor: 'pointer',
              }}
              title={t('common.delete')}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('settings.title')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          إدارة هوية المؤسسة، الضرائب، الفروع، والمظهر العام للبرنامج
        </p>
      </div>

      {/* Tabs Header */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Company Branding */}
      {activeTab === 'company' && (
        <Card title={t('settings.companyTab')}>
          <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Logo Upload Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                padding: '18px',
                borderRadius: '16px',
                backgroundColor: 'var(--border-subtle)',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '18px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '2px dashed var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {settings?.logo_path ? (
                  <img
                    src={settings.logo_path}
                    alt="Logo Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <ShieldCheck size={40} className="text-primary" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {t('settings.companyLogo')}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  يظهر الشعار في الفواتير المطبوعة، التقارير، والشريط الجانبي (PNG, JPG, WEBP)
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: 'none' }}
                />

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  style={{ marginTop: '10px' }}
                  onClick={() => fileInputRef.current?.click()}
                  loading={loading}
                >
                  {settings?.logo_path ? t('settings.changeLogo') : t('settings.uploadLogo')}
                </Button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <Input
                label={t('settings.companyName')}
                value={companyForm.company_name}
                onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                required
              />

              <Select
                label={t('settings.businessType')}
                value={companyForm.business_type}
                onChange={(e) => setCompanyForm({ ...companyForm, business_type: e.target.value })}
                options={businessTypeOptions.map((opt) => ({
                  value: opt.value,
                  label: t(`settings.businessTypes.${opt.value}`),
                }))}
              />

              <Input
                label={t('settings.taxNumber')}
                value={companyForm.tax_number}
                onChange={(e) => setCompanyForm({ ...companyForm, tax_number: e.target.value })}
              />

              <Input
                label={t('settings.companyPhone')}
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              />

              <Input
                label={t('settings.companyEmail')}
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <Input
                  label={t('settings.companyAddress')}
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" icon={Save} loading={loading}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Theme & Appearance */}
      {activeTab === 'theme' && (
        <Card title={t('settings.themeTab')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Color Palette Selector */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                {t('settings.themeColor')}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                اختر لون المظهر التمييزي للنظام بما يتناسب مع هوية شركتك
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {themeColors.map((color) => {
                  const isSelected = themeColor === color.hex;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => {
                        setThemeColor(color.hex);
                        updateSettings({ theme_color: color.hex }, user?.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${color.hex}` : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--border-subtle)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: color.hex,
                          display: 'inline-block',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: 'var(--text-main)' }}>
                        {color.name}
                      </span>
                      {isSelected && <CheckCircle size={16} style={{ color: color.hex }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dark Mode Toggle Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderRadius: '16px',
                backgroundColor: 'var(--border-subtle)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {t('settings.themeMode')}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isDarkMode ? 'الوضع الليلي مفعّل حالياً (Dark Mode)' : 'الوضع النهاري مفعّل حالياً (Light Mode)'}
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                icon={isDarkMode ? Sun : Moon}
                onClick={toggleDarkMode}
              >
                {isDarkMode ? t('settings.lightMode') : t('settings.darkMode')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Invoicing & Taxes */}
      {activeTab === 'invoicing' && (
        <Card title={t('settings.invoicingTab')}>
          <form onSubmit={handleSaveInvoicing} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>الدولة<select value={invoicingForm.country_code} onChange={(e) => { const c = countries.find((item) => item.code === e.target.value); setInvoicingForm({ ...invoicingForm, country_code: e.target.value, tax_country_code: e.target.value, currency_code: c?.default_currency_code || 'SAR' }); }} required style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>{countries.map((country) => <option key={country.code} value={country.code}>{country.name_ar}</option>)}</select></label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>العملة الأساسية<select value={invoicingForm.currency_code} onChange={(e) => setInvoicingForm({ ...invoicingForm, currency_code: e.target.value })} required style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.name_ar} ({currency.code})</option>)}</select></label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>العملة الثانوية<select value={invoicingForm.secondary_currency_code} onChange={(e) => setInvoicingForm({ ...invoicingForm, secondary_currency_code: e.target.value })} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}><option value="">اختياري</option>{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.name_ar} ({currency.code})</option>)}</select></label>

              <Input label="سعر الصرف" type="number" min="0.0001" step="0.0001" value={invoicingForm.exchange_rate} onChange={(e) => setInvoicingForm({ ...invoicingForm, exchange_rate: parseFloat(e.target.value) || 1.0 })} required />

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>تقويم التقارير والفواتير<select value={invoicingForm.calendar_type} onChange={(e) => setInvoicingForm({ ...invoicingForm, calendar_type: e.target.value })} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}><option value="gregorian">ميلادي</option><option value="hijri">هجري</option><option value="both">كلاهما</option></select></label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>تنسيق التاريخ<select value={invoicingForm.date_format} onChange={(e) => setInvoicingForm({ ...invoicingForm, date_format: e.target.value })} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}><option value="dd/MM/yyyy">يوم/شهر/سنة</option><option value="MM/dd/yyyy">شهر/يوم/سنة</option><option value="yyyy-MM-dd">سنة-شهر-يوم</option></select></label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>الخط<select value={invoicingForm.font_family} onChange={(e) => { const next = e.target.value; setInvoicingForm({ ...invoicingForm, font_family: next }); setFontFamily(next); updateSettings({ font_family: next }, user?.id); }} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>{fonts.map((font) => <option key={font.code} value={font.code}>{font.name_ar}</option>)}</select></label>

               <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>نوع الضريبة<input list="tax-type-datalist" value={invoicingForm.tax_type} onChange={(e) => setInvoicingForm({ ...invoicingForm, tax_type: e.target.value })} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }} placeholder="اختر أو اكتب نوع الضريبة" /><datalist id="tax-type-datalist">{taxTypeCatalog.map((type) => <option key={type} value={type} />)}</datalist></label>

              <Input label="كود قالب الدليل المحاسبي" value={invoicingForm.coa_template_code} onChange={(e) => setInvoicingForm({ ...invoicingForm, coa_template_code: e.target.value })} helperText="اتركه فارغاً لاختيار تلقائي حسب الدولة" />

              <Input label="ضريبة المبيعات (مخرجات) %" type="number" min="0" step="0.1" value={invoicingForm.sales_tax_percentage} onChange={(e) => setInvoicingForm({ ...invoicingForm, sales_tax_percentage: e.target.value })} required />

              <Input label="ضريبة المشتريات (مدخلات قابلة للخصم) %" type="number" min="0" step="0.1" value={invoicingForm.purchase_tax_percentage} onChange={(e) => setInvoicingForm({ ...invoicingForm, purchase_tax_percentage: e.target.value })} required />

              <Input label={t('settings.invoicePrefixSales')} value={invoicingForm.invoice_prefix_sales} onChange={(e) => setInvoicingForm({ ...invoicingForm, invoice_prefix_sales: e.target.value })} helperText="مثال: INV- ينتج عنها INV-2026-00001" />

              <Input label={t('settings.invoicePrefixPurchase')} value={invoicingForm.invoice_prefix_purchase} onChange={(e) => setInvoicingForm({ ...invoicingForm, invoice_prefix_purchase: e.target.value })} helperText="مثال: PO- ينتج عنها PO-2026-00001" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="tax_enabled_check"
                checked={!!invoicingForm.tax_enabled}
                onChange={(e) => setInvoicingForm({ ...invoicingForm, tax_enabled: e.target.checked ? 1 : 0 })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
              />
              <label htmlFor="tax_enabled_check" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                {t('settings.taxEnabled')}
              </label>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '15px' }}>تفعيل الضرائب التي تظهر عند إنشاء الفاتورة</h4>
                <Button variant="secondary" size="sm" icon={Plus} onClick={() => setAddTaxModalOpen(true)}>إضافة ضريبة جديدة</Button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '6px 0 12px' }}>فعّل الضريبة المطلوبة هنا، ثم ستظهر كخيار داخل فاتورة البيع أو الشراء حسب الدولة المختارة.</p>
              <div style={{ display: 'grid', gap: '8px' }}>
                {taxRules.map((rule) => (
                  <label key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '13px' }}>
                    <input type="checkbox" checked={Boolean(rule.is_enabled)} onChange={(event) => updateTaxRule(rule, event.target.checked)} />
                    <span>{rule.name} - {rule.transaction_type} ({rule.rate}%)</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({rule.tax_type})</span>
                    <button
                      onClick={() => deleteTaxRule(rule)}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-surface)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        marginLeft: 'auto',
                      }}
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </label>
                ))}
                {!taxRules.length && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد قواعد لهذه الدولة.</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" icon={Save} loading={loading}>
                {t('common.save')}
              </Button>
            </div>
          </form>

          {/* NOTE: this modal must stay OUTSIDE the invoicing <form> above.
              Nesting <form> inside <form> is invalid and silently breaks the
              submit handler (createTaxRule) so new taxes never get saved. */}
          <Modal isOpen={addTaxModalOpen} onClose={() => setAddTaxModalOpen(false)} title="إضافة ضريبة جديدة">
            <form onSubmit={createTaxRule} style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Input label="اسم الضريبة" required value={addTaxForm.name} onChange={(e) => setAddTaxForm({ ...addTaxForm, name: e.target.value })} />
                <Input label="اسم مختصر" value={addTaxForm.short_name} onChange={(e) => setAddTaxForm({ ...addTaxForm, short_name: e.target.value })} helperText="مثال: VAT، GST" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>نوع المعاملة
                  <select value={addTaxForm.transaction_type} onChange={(e) => setAddTaxForm({ ...addTaxForm, transaction_type: e.target.value })} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                    <option value="sale">مبيعات</option>
                    <option value="purchase">مشتريات</option>
                    <option value="service">خدمات</option>
                    <option value="consulting">استشارات</option>
                    <option value="all">الكل</option>
                  </select>
                </label>
                <Input label="النسبة %" type="number" min="0" step="0.1" required value={addTaxForm.rate} onChange={(e) => setAddTaxForm({ ...addTaxForm, rate: e.target.value })} />
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>نوع الضريبة
                <input list="add-tax-type-datalist" value={addTaxForm.tax_type} onChange={(e) => setAddTaxForm({ ...addTaxForm, tax_type: e.target.value })} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }} />
                <datalist id="add-tax-type-datalist">{taxTypeCatalog.map((type) => <option key={type} value={type} />)}</datalist>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Input label="تاريخ بدء السريان" type="date" value={addTaxForm.effective_from} onChange={(e) => setAddTaxForm({ ...addTaxForm, effective_from: e.target.value })} />
                <Input label="تاريخ انتهاء السريان" type="date" value={addTaxForm.effective_to} onChange={(e) => setAddTaxForm({ ...addTaxForm, effective_to: e.target.value })} helperText="اتركه فارغاً إذا كانت غير منتهية" />
              </div>

              <Input label="ملاحظات" value={addTaxForm.notes} onChange={(e) => setAddTaxForm({ ...addTaxForm, notes: e.target.value })} />

              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addTaxForm.is_default} onChange={(e) => setAddTaxForm({ ...addTaxForm, is_default: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                  ضريبة افتراضية
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addTaxForm.is_enabled} onChange={(e) => setAddTaxForm({ ...addTaxForm, is_enabled: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                  مفعلة
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="secondary" onClick={() => setAddTaxModalOpen(false)}>إلغاء</Button>
                <Button type="submit" icon={Plus}>إضافة الضريبة</Button>
              </div>
            </form>
          </Modal>
        </Card>
      )}

      {activeTab === 'accounting' && (
        <Card title="الدليل المحاسبي والقوالب">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              اختر قالباً محاسبياً جاهزاً (مصر/السعودية/عام) أو أنشئ دليلاً مخصصاً. 
              <strong style={{ color: 'var(--primary-color)' }}>تنبيه:</strong> تطبيق قالب جديد سيضيف الحسابات المفقودة فقط.
              إذا كانت هناك حسابات موجودة، سيطلب تأكيد قبل المتابعة.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: '10px', alignItems: 'end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                القالب المحاسبي
                <select value={selectedCoaTemplate} onChange={(event) => setSelectedCoaTemplate(event.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                  <option value="">اختر قالباً</option>
                  {coaTemplates.map((catalog) => <option key={catalog.id} value={catalog.id}>{catalog.name} ({catalog.country_code}) - {catalog.accounts_count} حساب</option>)}
                </select>
              </label>
              <Button icon={WandSparkles} onClick={applyAccountingCatalog}>تطبيق القالب</Button>
              <Button variant="secondary" icon={Plus} onClick={() => setAccountingCatalogModalOpen(true)}>إضافة دليل جديد</Button>
            </div>
          </div>
        </Card>
      )}

      <Modal isOpen={accountingCatalogModalOpen} onClose={() => setAccountingCatalogModalOpen(false)} title="إضافة دليل محاسبي جديد">
        <form onSubmit={createAccountingCatalog} style={{ display: 'grid', gap: '14px' }}>
          <Input label="اسم الدليل" required value={accountingCatalogForm.name} onChange={(event) => setAccountingCatalogForm({ ...accountingCatalogForm, name: event.target.value })} />
          <Input label="وصف الدليل" value={accountingCatalogForm.description} onChange={(event) => setAccountingCatalogForm({ ...accountingCatalogForm, description: event.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}><Button variant="secondary" onClick={() => setAccountingCatalogModalOpen(false)}>إلغاء</Button><Button type="submit" icon={Landmark}>حفظ الدليل</Button></div>
        </form>
      </Modal>

      {/* Tab 4: Branches */}
      {activeTab === 'branches' && (
        <Card
          title={t('settings.branchesList')}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenBranchModal()}
            >
              {t('settings.addBranch')}
            </Button>
          }
        >
          <Table columns={branchColumns} data={branches} />
        </Card>
      )}

      {/* Tab 5: System Info */}
      {activeTab === 'system' && (
        <Card title={t('settings.systemTab')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>اسم التطبيق</span>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  ERP Desktop System
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>إصدار البرنامج</span>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  v1.0.0 (Phase 1 Baseline)
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>محرك قاعدة البيانات</span>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  SQLite 3 (better-sqlite3 + WAL Mode)
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>واجهة المستخدم</span>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  React 18 + Vite + Electron IPC Bridge
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Add / Edit Branch Modal */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        title={editingBranch ? ' تعديل بيانات الفرع' : t('settings.addBranch')}
      >
        <form onSubmit={handleSaveBranch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label={t('settings.branchName')}
            value={branchForm.name}
            onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
            required
            autoFocus
          />

          <Input
            label={t('settings.branchAddress')}
            value={branchForm.address}
            onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
          />

          <Input
            label={t('settings.branchPhone')}
            value={branchForm.phone}
            onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={branchForm.isMainBranch}
                onChange={(e) => setBranchForm({ ...branchForm, isMainBranch: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
              />
              {t('settings.setAsMain')}
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={branchForm.isActive}
                onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
              />
              الفرع نشط ومتاح للعمليات
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setBranchModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Branch */}
      <ConfirmDialog
        isOpen={!!deleteBranchId}
        onClose={() => setDeleteBranchId(null)}
        onConfirm={handleDeleteBranch}
        title="تأكيد حذف الفرع"
        message="هل أنت متأكد من رغبتك في حذف هذا الفرع؟"
        loading={loading}
      />
    </div>
  );
};

export default SettingsPage;
