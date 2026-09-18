import React, { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Pagination from "../../../components/ui/Pagination";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";

const emptyForm = {
  full_name: '', phone: '', email: '', position: '', department: '', salary_base: 0, hire_date: '', is_active: 1,
};

const HrPage = () => {
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

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const response = await window.api?.hr?.employees({ query, branch_id: currentBranch?.id || 1, page: 1, limit: 20 });
    if (response?.success) setResult(response.data);
    else if (response?.error) toast.error(response.error);
    setLoading(false);
  }, [currentBranch?.id, query, toast]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (employee) => {
    setForm({ ...emptyForm, ...employee, hire_date: employee.hire_date || '', is_active: employee.is_active ?? 1 });
    setEditingId(employee.id);
    setModalOpen(true);
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    setSaving(true);
    const response = await window.api?.hr?.employeeSave({ ...form, branch_id: currentBranch?.id || 1, id: editingId || undefined });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadEmployees(); }
    else toast.error(response?.error || "تعذر حفظ الموظف");
    setSaving(false);
  };

  const deleteEmployee = async () => {
    const response = await window.api?.hr?.employeeDelete(deleteId);
    if (response?.success) { toast.success(response.message); loadEmployees(); }
    else toast.error(response?.error || "تعذر حذف الموظف");
    setDeleteId(null);
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const columns = [
    { key: "full_name", header: "الاسم", render: (value) => <strong>{value}</strong> },
    { key: "phone", header: "الهاتف" },
    { key: "email", header: "البريد" },
    { key: "position", header: "المسمى الوظيفي" },
    { key: "department", header: "القسم" },
    { key: "salary_base", header: "الراتب", align: "end", render: (value) => Number(value || 0).toFixed(2) },
    { key: "is_active", header: "الحالة", render: (value) => <Badge variant={value ? "success" : "danger"}>{value ? "نشط" : "معطل"}</Badge> },
    { key: "actions", header: "", align: "end", render: (_, row) => <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}><Button size="sm" variant="ghost" icon={Edit2} onClick={() => openEdit(row)} /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: "#ef4444" }} /></div> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>الموارد البشرية</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>إدارة الموظفين وبياناتهم</p></div>
        <Button icon={Plus} onClick={openCreate}>إضافة موظف</Button>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}><Input icon={Search} placeholder="ابحث بالاسم أو الهاتف أو القسم" value={query} onChange={(event) => setQuery(event.target.value)} /><span style={{ color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: 13 }}>{result.total || 0} موظف</span></div>
        <Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد موظفين مسجلين" />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'تعديل الموظف' : 'إضافة موظف جديد'} maxWidth="700px">
        <form onSubmit={saveEmployee} style={{ display: "grid", gap: 14 }}>
          <Input label="الاسم الكامل" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <Input label="الهاتف" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <Input label="المسمى الوظيفي" value={form.position} onChange={(e) => update('position', e.target.value)} />
            <Input label="القسم" value={form.department} onChange={(e) => update('department', e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <Input label="الراتب الأساسي" type="number" min="0" step="0.01" value={form.salary_base} onChange={(e) => update('salary_base', e.target.value)} />
            <Input label="تاريخ التعيين" type="date" value={form.hire_date} onChange={(e) => update('hire_date', e.target.value)} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => update('is_active', e.target.checked ? 1 : 0)} />
            موظف نشط
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={Plus} loading={saving}>حفظ الموظف</Button></div>
        </form>
      </Modal>
      {deleteId && (
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="تأكيد الحذف" maxWidth="400px" footer={
          <><Button variant="secondary" onClick={() => setDeleteId(null)}>إلغاء</Button><Button onClick={deleteEmployee} style={{ backgroundColor: '#ef4444' }}>حذف</Button></>
        }>
          <p style={{ color: "var(--text-muted)" }}>هل أنت متأكد من رغبتك في حذف هذا الموظف؟</p>
        </Modal>
      )}
    </div>
  );
};

export default HrPage;
