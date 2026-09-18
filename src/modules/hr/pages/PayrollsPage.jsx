import React, { useCallback, useEffect, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
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

const HrPayrollsPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [result, setResult] = useState({ items: [], total: 0 });
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({ employee_id: "", allowances: 0, deductions: 0 });
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    const response = await window.api?.hr?.employees({ branch_id: currentBranch?.id || 1, limit: 100 });
    if (response?.success) setEmployees(response.data.items);
  }, [currentBranch?.id]);

  const loadPayrolls = useCallback(async () => {
    setLoading(true);
    const params = { branch_id: currentBranch?.id || 1, employee_id: selectedEmployeeId || undefined, month, year: month.split("-")[0], page: 1, limit: 20 };
    const response = await window.api?.hr?.payrolls(params);
    if (response?.success) setResult(response.data);
    else toast.error(response?.error);
    setLoading(false);
  }, [currentBranch?.id, selectedEmployeeId, month, toast]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { loadPayrolls(); }, [loadPayrolls]);

  const generatePayroll = async (event) => {
    event.preventDefault();
    if (!generateForm.employee_id) return toast.error("اختر الموظف");
    setSaving(true);
    const d = new Date(month);
    const response = await window.api?.hr?.payrollGenerate({
      branch_id: currentBranch?.id || 1,
      employee_id: Number(generateForm.employee_id),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      allowances: Number(generateForm.allowances || 0),
      deductions: Number(generateForm.deductions || 0),
    });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadPayrolls(); }
    else toast.error(response?.error);
    setSaving(false);
  };

  const columns = [
    { key: "employee_name", header: "الموظف", render: (value) => <strong>{value}</strong> },
    { key: "month", header: "الشهر" },
    { key: "base_salary", header: "الراتب الأساسي", align: "end", render: (value) => Number(value || 0).toFixed(2) },
    { key: "allowances", header: "البدلات", align: "end", render: (value) => Number(value || 0).toFixed(2) },
    { key: "deductions", header: "الخصومات", align: "end", render: (value) => Number(value || 0).toFixed(2) },
    { key: "net_salary", header: "صافي الراتب", align: "end", render: (value) => <strong>{Number(value || 0).toFixed(2)}</strong> },
    { key: "status", header: "الحالة", render: (value) => <Badge variant={value === "posted" ? "success" : "warning"}>{value === "posted" ? "مُعتمَد" : "مسودة"}</Badge> },
    { key: "journal_entry_number", header: "القيد المحاسبي", render: (value) => value || "-" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>كشوف الرواتب</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>إنشاء كشوف الرواتب مع ربط بقيد محاسبي تلقائي</p></div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>إنشاء كشف رواتب</Button>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>الموظف<Select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}><option value="">الكل</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}</Select></label>
          <Input label="الشهر" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد كشوف رواتب" />
        <Pagination currentPage={result.page} totalPages={result.totalPages} totalItems={result.total} onPageChange={() => {}} />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="إنشاء كشف رواتب" maxWidth="500px">
        <form onSubmit={generatePayroll} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>الموظف<Select required value={generateForm.employee_id} onChange={(e) => setGenerateForm({ ...generateForm, employee_id: e.target.value })} options={[{ value: "", label: "اختر موظف" }, ...employees.map((emp) => ({ value: String(emp.id), label: `${emp.full_name} - راتب: ${emp.salary_base}` }))]} /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <Input label="البدلات" type="number" min="0" step="0.01" value={generateForm.allowances} onChange={(e) => setGenerateForm({ ...generateForm, allowances: e.target.value })} />
            <Input label="الخصومات" type="number" min="0" step="0.01" value={generateForm.deductions} onChange={(e) => setGenerateForm({ ...generateForm, deductions: e.target.value })} />
          </div>
          <div style={{ padding: "12px 16px", backgroundColor: "var(--border-subtle)", borderRadius: 10, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>الراتب الأساسي:</span><strong>{employees.find(e => e.id === Number(generateForm.employee_id))?.salary_base || 0}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>صافي الراتب:</span><strong style={{ color: "var(--primary-color)" }}>{(Number(generateForm.employee_id ? employees.find(e => e.id === Number(generateForm.employee_id))?.salary_base || 0) + Number(generateForm.allowances || 0) - Number(generateForm.deductions || 0)).toFixed(2)}</strong></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={FileText} loading={saving}>إنشاء وربط بقيد محاسبي</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default HrPayrollsPage;
