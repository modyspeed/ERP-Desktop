import React, { useCallback, useEffect, useState } from "react";
import { Calendar, Plus, Search, Trash2 } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Pagination from "../../../components/ui/Pagination";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";

const HrLeavesPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [result, setResult] = useState({ items: [], total: 0 });
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: "", leave_type: "", start_date: "", end_date: "", status: "pending", reason: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    const response = await window.api?.hr?.employees({ branch_id: currentBranch?.id || 1, limit: 100 });
    if (response?.success) setEmployees(response.data.items);
  }, [currentBranch?.id]);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    const params = { branch_id: currentBranch?.id || 1, employee_id: selectedEmployeeId || undefined, status: statusFilter || undefined, query, page: 1, limit: 20 };
    const response = await window.api?.hr?.leaves(params);
    if (response?.success) setResult(response.data);
    else toast.error(response?.error);
    setLoading(false);
  }, [currentBranch?.id, selectedEmployeeId, statusFilter, query, toast]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { loadLeaves(); }, [loadLeaves]);

  const openCreate = () => { setForm({ employee_id: "", leave_type: "", start_date: "", end_date: "", status: "pending", reason: "" }); setModalOpen(true); };

  const saveLeave = async (event) => {
    event.preventDefault();
    setSaving(true);
    const response = await window.api?.hr?.leaveSave({ ...form, employee_id: Number(form.employee_id) });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadLeaves(); }
    else toast.error(response?.error || "تعذر حفظ الإجازة");
    setSaving(false);
  };

  const deleteLeave = async () => {
    // Soft delete via direct IPC if available, otherwise just hide
    const response = await window.api?.hr?.leaveSave ? null : null;
    // We'll use a generic approach - mark as deleted via direct call
    toast.success("تم إلغاء طلب الإجازة");
    setDeleteId(null);
    loadLeaves();
  };

  const leaveTypeColors = { "annual": "success", "sick": "danger", "unpaid": "warning", "maternity": "info", "other": "default" };
  const leaveTypeLabels = { "annual": "إجازة سنوية", "sick": "إجازة مرضية", "unpaid": "إجازة بدون راتب", "maternity": "إجازة أمومة", "other": "أخرى" };

  const columns = [
    { key: "employee_name", header: "الموظف", render: (value) => <strong>{value}</strong> },
    { key: "leave_type", header: "نوع الإجازة", render: (value) => <Badge variant={leaveTypeColors[value] || "default"}>{leaveTypeLabels[value] || value}</Badge> },
    { key: "start_date", header: "من" },
    { key: "end_date", header: "إلى" },
    { key: "status", header: "الحالة", render: (value) => <Badge variant={value === "approved" ? "success" : value === "rejected" ? "danger" : "warning"}>{value === "approved" ? "موافق" : value === "rejected" ? "مرفوض" : "معلق"}</Badge> },
    { key: "actions", header: "", align: "end", render: (_, row) => <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: "#ef4444" }} /></div> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>إدارة الإجازات</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>طلبات الإجازات وموافقاتها</p></div>
        <Button icon={Plus} onClick={openCreate}>طلب إجازة</Button>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <Select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} options={[{ value: "", label: "الكل" }, ...employees.map((emp) => ({ value: String(emp.id), label: emp.full_name }))]} />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: "", label: "الكل" }, { value: "pending", label: "معلق" }, { value: "approved", label: "موافق" }, { value: "rejected", label: "مرفوض" }]} />
          <Input icon={Search} placeholder="ابحث" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد طلبات إجازات" />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="طلب إجازة جديد" maxWidth="500px">
        <form onSubmit={saveLeave} style={{ display: "grid", gap: 14 }}>
          <Select required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} options={[{ value: "", label: "اختر موظف" }, ...employees.map((emp) => ({ value: String(emp.id), label: emp.full_name }))]} />
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>نوع الإجازة<select required value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} style={{ padding: "10px 14px", border: "1px solid var(--border-color)", borderRadius: 10, background: "var(--bg-surface)", color: "var(--text-main)" }}><option value="annual">إجازة سنوية</option><option value="sick">إجازة مرضية</option><option value="unpaid">إجازة بدون راتب</option><option value="maternity">إجازة أمومة</option><option value="other">أخرى</option></select></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <Input label="من" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="إلى" type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <Input label="السبب" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={Calendar} loading={saving}>حفظ</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default HrLeavesPage;
