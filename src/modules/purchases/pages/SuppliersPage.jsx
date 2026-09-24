import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Mail, Phone, Plus, Search, Trash2, Truck } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  tax_number: '',
  opening_balance: 0,
  withholding_category: '',
  is_advance_payment_exempt: 0,
};

const WITHHOLDING_CATEGORIES = [
  { value: 'WHT_SUPPLIES', label: 'توريدات وسلع (1%)' },
  { value: 'WHT_CONTRACTING', label: 'مقاولات (1%)' },
  { value: 'WHT_GENERAL_SERVICES', label: 'خدمات عامة (2%)' },
  { value: 'WHT_PROFESSIONAL_FEES', label: 'مهن حرة / أتعاب مهنية / استشارات (5%)' },
  { value: 'WHT_BROKERAGE', label: 'سمسرة وعمولات وإعلانات (5%)' },
];

const categoryLabel = (code) => WITHHOLDING_CATEGORIES.find((cat) => cat.value === code)?.label || code || '';

const SuppliersPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [result, setResult] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadSuppliers = useCallback(async (page = 1) => {
    setLoading(true);
    const response = await window.api?.suppliers?.search({ query, branch_id: currentBranch?.id || 1, page, limit: 10 });
    if (response?.success) setResult(response.data);
    else if (response?.error) toast.error(response.error);
    setLoading(false);
  }, [currentBranch?.id, query, toast]);

  useEffect(() => { loadSuppliers(1); }, [loadSuppliers]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const saveSupplier = async (event) => {
    event.preventDefault();
    setSaving(true);
    const response = await window.api.suppliers.save({
      ...form,
      is_advance_payment_exempt: Number(Boolean(form.is_advance_payment_exempt)),
      branch_id: currentBranch?.id || 1,
    });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadSuppliers(result.page); }
    else toast.error(response?.error || 'تعذر حفظ المورد');
    setSaving(false);
  };
  const deleteSupplier = async () => {
    const response = await window.api.suppliers.delete(deleteId);
    if (response?.success) { toast.success(response.message); loadSuppliers(result.page); }
    else toast.error(response?.error || 'تعذر حذف المورد');
    setDeleteId(null);
  };
  const columns = [
    { key: 'name', header: 'المورد', render: (value) => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'grid', placeItems: 'center' }}><Truck size={17} /></div><strong>{value}</strong></div> },
    { key: 'phone', header: 'الهاتف', render: (value) => value ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={14} />{value}</span> : '-' },
    { key: 'email', header: 'البريد الإلكتروني', render: (value) => value ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={14} />{value}</span> : '-' },
    {
      key: 'withholding_category',
      header: 'تصنيف الخصم والإضافة',
      render: (value, row) => {
        if (Number(row.is_advance_payment_exempt) === 1) {
          return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#7c3aed', background: '#f3e8ff', padding: '4px 10px', borderRadius: 9999, whiteSpace: 'nowrap' }}>معفى — نظام الدفعات المقدمة</span>;
        }
        return value
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '4px 10px', borderRadius: 9999, whiteSpace: 'nowrap' }}>{categoryLabel(value)}</span>
          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>غير محدد — بدون خصم</span>;
      },
    },
    { key: 'current_balance', header: 'المستحق', align: 'end', render: (value) => <span style={{ color: Number(value) > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{Number(value || 0).toFixed(2)}</span> },
    { key: 'actions', header: '', align: 'end', render: (_, row) => <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}><Button size="sm" variant="ghost" icon={Edit2} onClick={() => { setForm({ ...emptyForm, ...row, is_advance_payment_exempt: Number(row.is_advance_payment_exempt || 0) }); setModalOpen(true); }} /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: '#ef4444' }} /></div> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>الموردون</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>إدارة بيانات الموردين والمستحقات</p>
        </div>
        <Button icon={Plus} onClick={() => { setForm(emptyForm); setModalOpen(true); }}>إضافة مورد</Button>
      </div>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Input icon={Search} placeholder="ابحث بالاسم أو الهاتف أو البريد" value={query} onChange={(event) => setQuery(event.target.value)} />
          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13 }}>{result.total} مورد</span>
        </div>
        <Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد بيانات موردين" />
        <Pagination currentPage={result.page} totalPages={result.totalPages} totalItems={result.total} onPageChange={loadSuppliers} />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'} maxWidth="640px">
        <form onSubmit={saveSupplier} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <Input label="اسم المورد" required value={form.name} onChange={(e) => update('name', e.target.value)} />
            <Input label="الهاتف" icon={Phone} value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
            <Input label="البريد الإلكتروني" type="email" icon={Mail} value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
            <Input label="الرقم الضريبي" value={form.tax_number || ''} onChange={(e) => update('tax_number', e.target.value)} />
            <Input label="العنوان" value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
            <Input label="الرصيد الافتتاحي" type="number" step="0.01" value={form.opening_balance} onChange={(e) => update('opening_balance', e.target.value)} />
          </div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
            <strong style={{ color: 'var(--text-main)', fontSize: 13 }}>ضريبة الخصم والإضافة (مصر)</strong>
            <Select
              label="تصنيف نشاط المورد"
              placeholder="غير محدد — بدون خصم تلقائي"
              options={WITHHOLDING_CATEGORIES}
              value={form.withholding_category || ''}
              onChange={(e) => update('withholding_category', e.target.value)}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Number(form.is_advance_payment_exempt) === 1}
                onChange={(e) => update('is_advance_payment_exempt', e.target.checked ? 1 : 0)}
                style={{ width: 16, height: 16, accentColor: 'var(--primary-color)' }}
              />
              <span>مسجّل في نظام الدفعات المقدمة — <strong>عدم خصم ضريبة الخصم والإضافة إطلاقاً</strong> على فواتيره</span>
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button type="submit" icon={Truck} loading={saving}>حفظ المورد</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={deleteSupplier} title="حذف المورد" message="هل أنت متأكد من حذف هذا المورد؟" />
    </div>
  );
};

export default SuppliersPage;
