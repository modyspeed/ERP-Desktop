import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Download, FileText, Printer, Search } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Pagination from "../../../components/ui/Pagination";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";

const REPORT_TYPES = [
  { key: "profit-loss", label: "تقرير الأرباح والخسائر", labelEn: "Profit & Loss" },
  { key: "inventory-movement", label: "تقرير حركة الأصناف", labelEn: "Inventory Movement" },
  { key: "tax", label: "تقرير ضريبة القيمة المضافة", labelEn: "VAT Tax Report" },
];

const toCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((row) => headers.map((h) => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const toExcel = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  let html = `<table border="1"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
  for (const row of data) {
    html += "<tr>" + headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("") + "</tr>";
  }
  html += "</tbody></table>";
  const blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
};

const ReportsPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [reportType, setReportType] = useState("profit-loss");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [movementItems, setMovementItems] = useState([]);
  const [movementTotal, setMovementTotal] = useState(0);
  const [movementPage, setMovementPage] = useState(1);

  const runReport = useCallback(async () => {
    setLoading(true);
    const params = {
      branch_id: currentBranch?.id || 1,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
    try {
      if (reportType === "profit-loss") {
        const response = await window.api?.reports?.profitLoss(params);
        if (response?.success) setData(response.data);
        else toast.error(response?.error);
      } else if (reportType === "inventory-movement") {
        const response = await window.api?.reports?.inventoryMovement({ ...params, page: 1, limit: 50 });
        if (response?.success) { setMovementItems(response.data.items); setMovementTotal(response.data.total); setMovementPage(1); }
        else toast.error(response?.error);
      } else if (reportType === "tax") {
        const response = await window.api?.reports?.taxReport(params);
        if (response?.success) setData(response.data);
        else toast.error(response?.error);
      }
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  }, [reportType, startDate, endDate, currentBranch?.id, toast]);

  useEffect(() => { runReport(); }, [runReport]);

  const exportCSV = () => {
    if (reportType === "profit-loss" && data) {
      toCSV([data.sales, data.purchases], `report_profit_loss_${startDate || "all"}_${endDate || "all"}`);
    } else if (reportType === "tax" && data) {
      toCSV([data], `report_tax_${startDate || "all"}_${endDate || "all"}`);
    } else if (movementItems.length) {
      toCSV(movementItems, `report_inventory_${startDate || "all"}_${endDate || "all"}`);
    }
    toast.success("تم تصدير CSV بنجاح");
  };

  const exportExcel = () => {
    if (reportType === "profit-loss" && data) {
      toExcel([data.sales, data.purchases], `report_profit_loss_${startDate || "all"}_${endDate || "all"}`);
    } else if (reportType === "tax" && data) {
      toExcel([data], `report_tax_${startDate || "all"}_${endDate || "all"}`);
    } else if (movementItems.length) {
      toExcel(movementItems, `report_inventory_${startDate || "all"}_${endDate || "all"}`);
    }
    toast.success("تم تصدير Excel بنجاح");
  };

  const loadMovementPage = (page) => {
    window.api?.reports?.inventoryMovement({
      branch_id: currentBranch?.id || 1,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page,
      limit: 50,
    }).then((response) => {
      if (response?.success) { setMovementItems(response.data.items); setMovementTotal(response.data.total); setMovementPage(page); }
    });
  };

  const profitLossData = useMemo(() => {
    if (!data || reportType !== "profit-loss") return null;
    return [
      { label: "إجمالي المبيعات", value: data.sales.total, type: "currency" },
      { label: "إجمالي المشتريات", value: data.purchases.total, type: "currency" },
      { label: "إجمالي الضرائب المدفوعة", value: data.purchases.tax, type: "currency" },
      { label: "إجمالي المصروفات", value: data.expenses, type: "currency" },
      { label: "الربح الإجمالي", value: data.gross_profit, type: "currency", highlight: data.gross_profit >= 0 },
      { label: "صافي الربح", value: data.net_profit, type: "currency", highlight: true },
    ];
  }, [data, reportType]);

  const columns = [
    { key: "product_name", header: "الصنف", render: (value) => <strong>{value}</strong> },
    { key: "sku", header: "الكود" },
    { key: "warehouse_name", header: "المستودع" },
    { key: "movement_type", header: "نوع الحركة", render: (value) => <Badge variant={value === "in" ? "success" : value === "out" ? "danger" : "info"}>{value === "in" ? "وارد" : value === "out" ? "صادر" : value === "transfer" ? "تحويل" : "تعديل"}</Badge> },
    { key: "quantity", header: "الكمية", align: "center" },
    { key: "notes", header: "ملاحظات", render: (value) => value || "-" },
  ];

  const movementColumns = [
    { key: "product_name", header: "الصنف", render: (value) => <strong>{value}</strong> },
    { key: "sku", header: "الكود" },
    { key: "warehouse_name", header: "المستودع" },
    { key: "movement_type", header: "نوع الحركة", render: (value) => <Badge variant={value === "in" ? "success" : value === "out" ? "danger" : "info"}>{value === "in" ? "وارد" : value === "out" ? "صادر" : value === "transfer" ? "تحويل" : "تعديل"}</Badge> },
    { key: "quantity", header: "الكمية", align: "center" },
    { key: "created_at", header: "التاريخ" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>التقارير</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>تقارير تحليلية قابلة للتصدير بصيغ CSV / Excel / طباعة</p></div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Select value={reportType} onChange={(e) => setReportType(e.target.value)} options={REPORT_TYPES.map((r) => ({ value: r.key, label: r.label }))} />
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span style={{ color: "var(--text-muted)" }}>إلى</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button icon={Search} onClick={runReport}>عرض التقرير</Button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" icon={Download} onClick={exportCSV}>تصدير CSV</Button>
          <Button variant="secondary" icon={FileText} onClick={exportExcel}>تصدير Excel</Button>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>طباعة</Button>
        </div>
      </Card>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>جاري تحميل التقرير...</div>}

      {!loading && reportType === "profit-loss" && data && (
        <Card title="تقرير الأرباح والخسائر" noPadding>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1 }}>
            {profitLossData && profitLossData.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px", backgroundColor: idx % 2 === 0 ? "var(--bg-surface)" : "var(--border-subtle)", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{item.label}</span>
                <strong style={{ color: item.highlight === false ? "#ef4444" : item.highlight ? "#10b981" : "var(--text-main)", fontSize: 15 }}>
                  {Number(item.value || 0).toFixed(2)}
                </strong>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && reportType === "tax" && data && (
        <Card title="تقرير ضريبة القيمة المضافة" noPadding>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1 }}>
            {[
              { label: "دولة الضريبة", value: data.country_code },
              { label: "نسبة ضريبة المبيعات", value: `${data.sales_tax_rate}%` },
              { label: "نسبة ضريبة المشتريات", value: `${data.purchase_tax_rate}%` },
              { label: "الضريبة المحصلة", value: data.tax_collected.toFixed(2), highlight: true },
              { label: "الضريبة المدفوعة", value: data.tax_paid.toFixed(2), highlight: true },
              { label: "الضريبة المستحقة", value: data.tax_due.toFixed(2), highlight: data.tax_due < 0 ? false : true },
              { label: "عدد فواتير المبيعات", value: data.sales_invoices },
              { label: "عدد فواتير المشتريات", value: data.purchase_invoices },
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px", backgroundColor: idx % 2 === 0 ? "var(--bg-surface)" : "var(--border-subtle)", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{item.label}</span>
                <strong style={{ color: item.highlight ? (item.value < 0 ? "#ef4444" : "#10b981") : "var(--text-main)", fontSize: 15 }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && reportType === "inventory-movement" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>إجمالي الحركات: {movementTotal}</span>
          </div>
          <Table columns={movementColumns} data={movementItems} loading={loading} emptyMessage="لا توجد حركات للمخزون" />
          <Pagination currentPage={movementPage} totalPages={Math.ceil(movementTotal / 50) || 1} totalItems={movementTotal} onPageChange={loadMovementPage} />
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
