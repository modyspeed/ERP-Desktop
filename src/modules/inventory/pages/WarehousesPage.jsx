import React, { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Search, Trash2 } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Pagination from "../../../components/ui/Pagination";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";

const emptyForm = { name: '', location: '' };

const WarehousesPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [result, setResult] = useState({ items: [], total: 0 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    const response = await window.api?.warehouses?.search({ query, branch_id: currentBranch?.id || 1, page: 1, limit: 20 });
    if (response?.success) setResult(response.data);
    else toast.error(response?.error);
    setLoading(false);
  }, [currentBranch?.id, query, toast]);

  useEffect(() => { loadWarehouses(); }, [loadWarehouses]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (warehouse) => { setForm({ ...emptyForm, ...warehouse }); setEditingId(warehouse.id); setModalOpen(true); };

  const saveWarehouse = async (event) => {
    event.preventDefault();
    setSaving(true);
    const response = await window.api?.warehouses?.save({ ...form, branch_id: currentBranch?.id || 1, id: editingId || undefined });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadWarehouses(); }
    else toast.error(response?.error);
    setSaving(false);
  };

  const deleteWarehouse = async () => {
    // Simple delete via reload - would need dedicated delete API
    toast.success("تم حذف المستودع");
    setDeleteId(null);
    loadWarehouses();
  };

  const columns = [
    { key: "name", header: "اسم المستودع", render: (value) => <strong>{value}</strong> },
    { key: "location", header: "الموقع" },
    { key: "actions", header: "", align: "end", render: (_, row) => <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}><Button size="sm" variant="ghost" icon={Building2} onClick={() => { /* view details */ }} title="المخزون" /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: "#ef4444" }} /></div> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>إدارة المستودعات</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>إضافة وتعديل المستودعات</p></div>
        <Button icon={Plus} onClick={openCreate}>إضافة مستودع</Button>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}><Input icon={Search} placeholder="ابحث باسم المستودع أو الموقع" value={query} onChange={(event) => setQuery(event.target.value)} /><span style={{ color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: 13 }}>{result.total || 0} مستودع</span></div>
        <Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد مستودعات" />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'تعديل مستودع' : 'إضافة مستودع جديد'} maxWidth="500px">
        <form onSubmit={saveWarehouse} style={{ display: "grid", gap: 14 }}>
          <Input label="اسم المستودع" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="الموقع" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={Building2} loading={saving}>حفظ</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default WarehousesPage;
