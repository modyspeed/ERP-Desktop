import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, FolderTree, Package, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Table from '../../../components/ui/Table';
import ImportModal from '../../../components/import/ImportModal';

const emptyForm = {
  name: '', sku: '', barcode: '', category_id: '', cost_price: 0, sale_price: 0, min_stock_alert: 5,
};

const ProductsPage = () => {
  const { currentBranch } = useSettings();
  const navigate = useNavigate();
  const toast = useToast();
  const [result, setResult] = useState({ items: [], total: 0 });
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const response = await window.api?.products?.search({ query, branch_id: currentBranch?.id || 1 });
    if (response?.success) setResult(response.data);
    else if (response?.error) toast.error(response.error);
    setLoading(false);
  }, [currentBranch?.id, query, toast]);

  useEffect(() => {
    loadProducts();
    window.api?.products?.categories(currentBranch?.id || 1).then((response) => {
      if (response?.success) setCategories(response.data);
    });
  }, [currentBranch?.id, loadProducts]);

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };
  const openEdit = (product) => {
    setForm({ ...emptyForm, ...product, category_id: product.category_id || '' });
    setModalOpen(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    const response = await window.api.products.save({ ...form, branch_id: currentBranch?.id || 1 });
    if (response?.success) {
      toast.success(response.message);
      setModalOpen(false);
      loadProducts();
    } else toast.error(response?.error || 'تعذر حفظ المنتج');
    setSaving(false);
  };

  const deleteProduct = async () => {
    const response = await window.api.products.delete(deleteId);
    if (response?.success) { toast.success(response.message); loadProducts(); }
    else toast.error(response?.error || 'تعذر حذف المنتج');
    setDeleteId(null);
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const columns = [
    { key: 'name', header: 'المنتج', render: (value, row) => <div><strong>{value}</strong><div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.sku || 'بدون كود'}</div></div> },
    { key: 'barcode', header: 'الباركود', render: (value) => value || '-' },
    { key: 'category_name', header: 'التصنيف', render: (value) => value || 'غير مصنف' },
    { key: 'stock_quantity', header: 'المخزون', align: 'center', render: (value, row) => <span style={{ color: Number(value) <= Number(row.min_stock_alert) ? '#ef4444' : 'var(--text-main)', fontWeight: 700 }}>{Number(value || 0).toLocaleString()}</span> },
    { key: 'sale_price', header: 'سعر البيع', align: 'end', render: (value) => `${Number(value || 0).toFixed(2)}` },
    { key: 'actions', header: '', align: 'end', render: (_, row) => <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}><Button size="sm" variant="ghost" icon={Edit2} onClick={() => openEdit(row)} /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: '#ef4444' }} /></div> },
  ];

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>المنتجات والمخزون</h1><p style={{ color: 'var(--text-muted)', marginTop: 4 }}>إدارة الأصناف والأسعار والكميات المتاحة</p></div>
      <div style={{ display: 'flex', gap: 8 }}><Button variant="secondary" icon={Upload} onClick={() => setImportOpen(true)}>استيراد</Button><Button variant="secondary" icon={FolderTree} onClick={() => navigate('/categories')}>التصنيفات</Button><Button icon={Plus} onClick={openCreate}>إضافة منتج</Button></div>
    </div>
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}><Input icon={Search} placeholder="ابحث بالاسم أو الكود أو الباركود" value={query} onChange={(event) => setQuery(event.target.value)} /><div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13 }}>{result.total || 0} منتج</div></div>
      <Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد منتجات مسجلة" />
    </Card>
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'تعديل المنتج' : 'إضافة منتج جديد'} maxWidth="700px">
      <form onSubmit={saveProduct} style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <Input label="اسم المنتج" required value={form.name} onChange={(e) => update('name', e.target.value)} />
          <Input label="SKU / كود الصنف" value={form.sku || ''} onChange={(e) => update('sku', e.target.value)} />
          <Input label="الباركود" value={form.barcode || ''} onChange={(e) => update('barcode', e.target.value)} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>التصنيف<select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-surface)', color: 'var(--text-main)' }}><option value="">غير مصنف</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <Input label="سعر التكلفة" type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => update('cost_price', e.target.value)} />
          <Input label="سعر البيع" type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => update('sale_price', e.target.value)} />
          <Input label="حد تنبيه المخزون" type="number" min="0" step="1" value={form.min_stock_alert} onChange={(e) => update('min_stock_alert', e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={Package} loading={saving}>حفظ المنتج</Button></div>
      </form>
    </Modal>
    <ConfirmDialog isOpen={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={deleteProduct} title="حذف المنتج" message="هل أنت متأكد من حذف هذا المنتج؟" />
    <ImportModal open={importOpen} type="products" branchId={currentBranch?.id || 1} onClose={() => setImportOpen(false)} onImported={loadProducts} />
  </div>;
};

export default ProductsPage;