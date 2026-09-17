import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, FolderTree, Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Table from '../../../components/ui/Table';

const CategoriesPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', parent_id: '' });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const response = await window.api?.categories?.list(currentBranch?.id || 1);
    if (response?.success) setCategories(response.data);
    else if (response?.error) toast.error(response.error);
    setLoading(false);
  }, [currentBranch?.id, toast]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const saveCategory = async (event) => {
    event.preventDefault();
    const response = await window.api.categories.save({ ...form, branch_id: currentBranch?.id || 1 });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadCategories(); }
    else toast.error(response?.error || 'تعذر حفظ التصنيف');
  };
  const deleteCategory = async () => {
    const response = await window.api.categories.delete(deleteId);
    if (response?.success) { toast.success(response.message); setDeleteId(null); loadCategories(); }
    else toast.error(response?.error || 'تعذر حذف التصنيف');
  };
  const columns = [
    { key: 'name', header: 'التصنيف', render: (value) => <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FolderTree size={17} color="var(--primary-color)" /><strong>{value}</strong></div> },
    { key: 'parent_name', header: 'التصنيف الأب', render: (value) => value || 'رئيسي' },
    { key: 'products_count', header: 'عدد المنتجات', align: 'center' },
    { key: 'actions', header: '', align: 'end', render: (_, row) => <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}><Button size="sm" variant="ghost" icon={Edit2} onClick={() => { setForm({ name: row.name, parent_id: row.parent_id || '' , id: row.id }); setModalOpen(true); }} /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: '#ef4444' }} /></div> },
  ];

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>تصنيفات المخزون والمنتجات</h1><p style={{ color: 'var(--text-muted)', marginTop: 4 }}>تنظيم المنتجات داخل مجموعات وتصنيفات</p></div><Button icon={Plus} onClick={() => { setForm({ name: '', parent_id: '' }); setModalOpen(true); }}>إضافة تصنيف</Button></div><Card><Table columns={columns} data={categories} loading={loading} emptyMessage="لا توجد تصنيفات" /></Card><Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}><form onSubmit={saveCategory} style={{ display: 'grid', gap: 14 }}><Input label="اسم التصنيف" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>التصنيف الأب<select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-surface)', color: 'var(--text-main)' }}><option value="">بدون تصنيف أب</option>{categories.filter((category) => category.id !== form.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={FolderTree}>حفظ التصنيف</Button></div></form></Modal><ConfirmDialog isOpen={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={deleteCategory} title="حذف التصنيف" message="هل أنت متأكد من حذف التصنيف؟" /></div>;
};

export default CategoriesPage;