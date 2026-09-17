import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Mail, Phone, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import Table from '../../../components/ui/Table';

const emptyForm = { name: '', phone: '', email: '', address: '', tax_number: '', category: '', credit_limit: 0, opening_balance: 0 };

const CustomersPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [result, setResult] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    const response = await window.api?.customers?.search({ query, branch_id: currentBranch?.id || 1, page, limit: 10 });
    if (response?.success) setResult(response.data);
    else if (response?.error) toast.error(response.error);
    setLoading(false);
  }, [currentBranch?.id, query, toast]);

  useEffect(() => { loadCustomers(1); }, [loadCustomers]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };
  const openEdit = (customer) => { setForm({ ...emptyForm, ...customer }); setModalOpen(true); };

  const saveCustomer = async (event) => {
    event.preventDefault();
    setSaving(true);
    const response = await window.api.customers.save({ ...form, branch_id: currentBranch?.id || 1 });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadCustomers(result.page); }
    else toast.error(response?.error || 'تعذر حفظ العميل');
    setSaving(false);
  };

  const deleteCustomer = async () => {
    const response = await window.api.customers.delete(deleteId);
    if (response?.success) { toast.success(response.message); loadCustomers(result.page); }
    else toast.error(response?.error || 'تعذر حذف العميل');
    setDeleteId(null);
  };

  const columns = [
    { key: 'name', header: 'العميل', render: (value) => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'grid', placeItems: 'center' }}><UserRound size={17} /></div><strong>{value}</strong></div> },
    { key: 'phone', header: 'الهاتف', render: (value) => value ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={14} />{value}</span> : '-' },
    { key: 'email', header: 'البريد الإلكتروني', render: (value) => value ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={14} />{value}</span> : '-' },
    { key: 'category', header: 'التصنيف', render: (value) => value || 'عام' },
    { key: 'current_balance', header: 'الرصيد', align: 'end', render: (value) => <span style={{ color: Number(value) > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{Number(value || 0).toFixed(2)}</span> },
    { key: 'actions', header: '', align: 'end', render: (_, row) => <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}><Button size="sm" variant="ghost" icon={Edit2} onClick={() => openEdit(row)} /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: '#ef4444' }} /></div> },
  ];

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>العملاء</h1><p style={{ color: 'var(--text-muted)', marginTop: 4 }}>إدارة بيانات العملاء والأرصدة والحدود الائتمانية</p></div><Button icon={Plus} onClick={openCreate}>إضافة عميل</Button></div>
    <Card><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}><Input icon={Search} placeholder="ابحث بالاسم أو الهاتف أو البريد" value={query} onChange={(event) => setQuery(event.target.value)} /><div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13 }}>{result.total || 0} عميل</div></div><Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد بيانات عملاء" /><Pagination currentPage={result.page} totalPages={result.totalPages} totalItems={result.total} pageSize={10} onPageChange={loadCustomers} /></Card>
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'} maxWidth="700px"><form onSubmit={saveCustomer} style={{ display: 'grid', gap: 14 }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}><Input label="اسم العميل" required value={form.name} onChange={(e) => update('name', e.target.value)} /><Input label="الهاتف" icon={Phone} value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /><Input label="البريد الإلكتروني" type="email" icon={Mail} value={form.email || ''} onChange={(e) => update('email', e.target.value)} /><Input label="التصنيف" value={form.category || ''} onChange={(e) => update('category', e.target.value)} /><Input label="الرقم الضريبي" value={form.tax_number || ''} onChange={(e) => update('tax_number', e.target.value)} /><Input label="العنوان" value={form.address || ''} onChange={(e) => update('address', e.target.value)} /><Input label="الحد الائتماني" type="number" min="0" step="0.01" value={form.credit_limit} onChange={(e) => update('credit_limit', e.target.value)} /><Input label="الرصيد الافتتاحي" type="number" step="0.01" value={form.opening_balance} onChange={(e) => update('opening_balance', e.target.value)} /></div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={UserRound} loading={saving}>حفظ العميل</Button></div></form></Modal>
    <ConfirmDialog isOpen={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={deleteCustomer} title="حذف العميل" message="هل أنت متأكد من حذف هذا العميل؟" />
  </div>;
};

export default CustomersPage;