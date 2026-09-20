import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Pagination from "../../../components/ui/Pagination";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";

const HrAttendancePage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [attendance, setAttendance] = useState({ items: [], total: 0 });
  const [summary, setSummary] = useState({ total_days: 0, present_days: 0, absent_days: 0, leave_days: 0 });
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("present");
  const [deleteRecordId, setDeleteRecordId] = useState(null);

  const loadEmployees = useCallback(async () => {
    const response = await window.api?.hr?.employees({ branch_id: currentBranch?.id || 1, limit: 100 });
    if (response?.success) setEmployees(response.data.items);
  }, [currentBranch?.id]);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    const params = { branch_id: currentBranch?.id || 1, date, employee_id: selectedEmployeeId || undefined, query, page: 1, limit: 30 };
    const response = await window.api?.hr?.attendance(params);
    if (response?.success) setAttendance(response.data);
    else toast.error(response?.error);
    setLoading(false);
  }, [currentBranch?.id, date, selectedEmployeeId, query, toast]);

  const loadSummary = useCallback(async () => {
    const d = new Date(date);
    const response = await window.api?.hr?.attendanceSummary({ employee_id: selectedEmployeeId || undefined, month: d.getMonth() + 1, year: d.getFullYear() });
    if (response?.success) setSummary(response.data);
  }, [date, selectedEmployeeId]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { loadAttendance(); loadSummary(); }, [loadAttendance, loadSummary]);

  const todayAttendance = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return attendance.items.find((a) => a.date === date && a.employee_id === Number(selectedEmployeeId));
  }, [attendance.items, date, selectedEmployeeId]);

  const checkInOut = async () => {
    if (!selectedEmployeeId) return toast.error("اختر الموظف أولاً");
    setSaving(true);
    const response = await window.api?.hr?.attendanceUpsert({
      employee_id: Number(selectedEmployeeId),
      date,
      check_in: checkIn || null,
      check_out: checkOut || null,
      status,
    });
    if (response?.success) { toast.success(response.message); loadAttendance(); loadSummary(); }
    else toast.error(response?.error);
    setSaving(false);
  };

  const columns = [
    { key: "employee_name", header: "الموظف", render: (value) => <strong>{value}</strong> },
    { key: "date", header: "التاريخ" },
    { key: "check_in", header: "الدوام", render: (value) => value || "-" },
    { key: "check_out", header: "انصراف", render: (value) => value || "-" },
    { key: "status", header: "الحالة", render: (value) => <Badge variant={value === "present" ? "success" : value === "absent" ? "danger" : "warning"}>{value === "present" ? "حاضر" : value === "absent" ? "غائب" : "إجازة"}</Badge> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>حضور وانصراف</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>سجلات الحضور والانصراف والملخص</p></div>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>الموظف<Select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} options={[{ value: "", label: "الكل" }, ...employees.map((emp) => ({ value: String(emp.id), label: emp.full_name }))]} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>التاريخ<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        </div>
      </Card>
      <Card title="تسجيل الحضور والانصراف">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, auto))", gap: 14, alignItems: "end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>الحضور (دوام)<Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>الانصراف<Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>الحالة<Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "present", label: "حاضر" }, { value: "absent", label: "غائب" }, { value: "leave", label: "إجازة" }]} /></label>
          <Button icon={Check} onClick={checkInOut} loading={saving}>تسجيل الحضور</Button>
        </div>
      </Card>
      {selectedEmployeeId && todayAttendance && (
        <Card title="سجل اليوم" noPadding>
          <div style={{ display: "flex", gap: 24, padding: "16px 24px" }}>
            <div><span style={{ color: "var(--text-muted)", fontSize: 12 }}>الدوام</span><br/><strong>{todayAttendance.check_in || "-"}</strong></div>
            <div><span style={{ color: "var(--text-muted)", fontSize: 12 }}>الانصراف</span><br/><strong>{todayAttendance.check_out || "-"}</strong></div>
            <div><span style={{ color: "var(--text-muted)", fontSize: 12 }}>الحالة</span><br/><Badge variant={todayAttendance.status === "present" ? "success" : todayAttendance.status === "absent" ? "danger" : "warning"}>{todayAttendance.status === "present" ? "حاضر" : todayAttendance.status === "absent" ? "غائب" : "إجازة"}</Badge></div>
          </div>
        </Card>
      )}
      <Card title="ملخص الشهر">
        <div style={{ display: "flex", gap: 24 }}>
          <div><span style={{ color: "var(--text-muted)", fontSize: 12 }}>أيام الشهر</span><br/><strong>{summary.total_days}</strong></div>
          <div><span style={{ color: "var(--text-muted)", fontSize: 12 }}>حاضر</span><br/><strong style={{ color: "#10b981" }}>{summary.present_days}</strong></div>
          <div><span style={{ color: "var(--text-muted)", fontSize: 12 }}>غائب</span><br/><strong style={{ color: "#ef4444" }}>{summary.absent_days}</strong></div>
          <div><span style={{ color: "var(--text-muted)", fontSize: 12 }}>إجازة</span><br/><strong style={{ color: "#f59e0b" }}>{summary.leave_days}</strong></div>
        </div>
      </Card>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}><Input icon={Search} placeholder="ابحث" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <Table columns={columns} data={attendance.items} loading={loading} emptyMessage="لا توجد سجلات حضور" />
        <Pagination currentPage={attendance.page} totalPages={attendance.totalPages} totalItems={attendance.total} onPageChange={(page) => { /* pagination handled via re-load */ }} />
      </Card>
    </div>
  );
};

export default HrAttendancePage;
