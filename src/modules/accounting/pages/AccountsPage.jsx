import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Landmark, Plus, Search, Trash2, WandSparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Table from '../../../components/ui/Table';

const emptyForm = { code: '', name: '', account_type: 'asset', parent_id: '' };
const accountTypes = { asset: 'أصل', liability: 'التزام', equity: 'حقوق ملكية', revenue: 'إيراد', expense: 'مصروف' };

const AccountsPage = () => {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogForm, setCatalogForm] = useState({ name: '', country_code: 'CUSTOM', description: '' });

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const response = await window.api?.accounts?.list({ query });
    if (response?.success) setAccounts(response.data);
    else if (response?.error) toast.error(response.error);
    setLoading(false);
  }, [query, toast]);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => {
    window.api?.accounts?.catalogs().then((response) => {
      if (response?.success) {
        setCatalogs(response.data);
        const active = response.data.find((catalog) => catalog.is_active);
        if (active) setSelectedCatalog(String(active.id));
      }
    });
  }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const saveAccount = async (event) => {
    event.preventDefault(); setSaving(true);
    const response = await window.api.accounts.save(form);
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadAccounts(); }
    else toast.error(response?.error || 'تعذر حفظ الحساب');
    setSaving(false);
  };
  const deleteAccount = async () => {
    const response = await window.api.accounts.delete(deleteId);
    if (response?.success) { toast.success(response.message); loadAccounts(); }
    else toast.error(response?.error || 'تعذر حذف الحساب');
    setDeleteId(null);
  };
  const applyCatalog = async () => {
    if (!selectedCatalog) return toast.error('اختر دليلاً محاسبياً أولاً');
    const response = await window.api.accounts.applyCatalog(Number(selectedCatalog));
    if (response?.success) { toast.success(response.message); loadAccounts(); }
    else toast.error(response?.error || 'تعذر تطبيق الدليل');
  };
  const createCatalog = async (event) => {
    event.preventDefault();
    const response = await window.api.accounts.createCatalog(catalogForm);
    if (response?.success) {
      toast.success(response.message);
      setCatalogModalOpen(false);
      const catalogsResponse = await window.api.accounts.catalogs();
      if (catalogsResponse?.success) setCatalogs(catalogsResponse.data);
    } else toast.error(response?.error || 'تعذر إنشاء الدليل');
  };
  const columns = [
    { key: 'code', header: 'الرمز', render: (value) => <strong style={{ color: 'var(--primary-color)' }}>{value}</strong> },
    { key: 'name', header: 'اسم الحساب', render: (value, row) => <div><strong>{value}</strong>{row.parent_name && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>الأب: {row.parent_name}</div>}</div> },
    { key: 'account_type', header: 'النوع', render: (value) => accountTypes[value] || value },
    { key: 'is_active', header: 'الحالة', render: (value) => value ? 'نشط' : 'غير نشط' },
    { key: 'actions', header: '', align: 'end', render: (_, row) => <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}><Button size="sm" variant="ghost" icon={Edit2} onClick={() => { setForm({ ...emptyForm, ...row, parent_id: row.parent_id || '' }); setModalOpen(true); }} /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: '#ef4444' }} /></div> },
  ];

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>دليل الحسابات</h1><p style={{ color: 'var(--text-muted)', marginTop: 4 }}>تنظيم الحسابات المالية والحسابات الفرعية</p></div><Button icon={Plus} onClick={() => { setForm(emptyForm); setModalOpen(true); }}>إضافة حساب</Button></div><Card><div style={{ marginBottom: 18 }}><Input icon={Search} placeholder="ابحث برمز الحساب أو اسمه" value={query} onChange={(e) => setQuery(e.target.value)} /></div><Table columns={columns} data={accounts} loading={loading} emptyMessage="لا توجد حسابات مسجلة" /></Card><Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'تعديل الحساب' : 'إضافة حساب جديد'}><form onSubmit={saveAccount} style={{ display: 'grid', gap: 14 }}><Input label="رمز الحساب" required value={form.code} onChange={(e) => update('code', e.target.value)} /><Input label="اسم الحساب" required value={form.name} onChange={(e) => update('name', e.target.value)} /><label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>نوع الحساب<select value={form.account_type} onChange={(e) => update('account_type', e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-surface)', color: 'var(--text-main)' }}>{Object.entries(accountTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>الحساب الأب<select value={form.parent_id} onChange={(e) => update('parent_id', e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-surface)', color: 'var(--text-main)' }}><option value="">بدون حساب أب</option>{accounts.filter((account) => account.id !== form.id).map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={Landmark} loading={saving}>حفظ الحساب</Button></div></form></Modal><ConfirmDialog isOpen={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={deleteAccount} title="حذف الحساب" message="هل أنت متأكد من حذف هذا الحساب؟" /></div>;
};

export default AccountsPage;