import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

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

const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول');
      toast.error(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {error && (
        <div
          className="animate-fade-in"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      <Input
        label={t('auth.username')}
        icon={User}
        placeholder={t('auth.usernamePlaceholder')}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoFocus
      />

      <div style={{ position: 'relative' }}>
        <Input
          label={t('auth.password')}
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            insetInlineEnd: '12px',
            bottom: '10px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: '16px', height: '16px', borderRadius: '4px', accentColor: 'var(--primary-color)' }}
          />
          {t('auth.rememberMe')}
        </label>

        <span style={{ color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}>
          {t('auth.forgotPassword')}
        </span>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        icon={LogIn}
        style={{ width: '100%', marginTop: '6px' }}
      >
        {t('auth.loginButton')}
      </Button>

      {/* Helpful Hint */}
      <div
        style={{
          marginTop: '12px',
          padding: '10px',
          borderRadius: '10px',
          backgroundColor: 'var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        حساب المسؤول الافتراضي: <strong>admin</strong> | كلمة المرور: <strong>admin123</strong>
      </div>
    </form>
  );
};

export default LoginPage;
