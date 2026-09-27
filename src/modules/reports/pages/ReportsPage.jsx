import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Download, FileText, Printer, Search } from "lucide-react";
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
  { key: "trial-balance", label: "ميزان المراجعة", labelEn: "Trial Balance" },
  { key: "income-statement", label: "قائمة الدخل", labelEn: "Income Statement" },
  { key: "balance-sheet", label: "الميزانية العمومية", labelEn: "Balance Sheet" },
  { key: "inventory-movement", label: "تقرير حركة الأصناف", labelEn: "Inventory Movement" },
  { key: "tax", label: "تقرير ضريبة القيمة المضافة", labelEn: "VAT Tax Report" },
];

const accountTypeLabels = { asset: "أصل", liability: "التزام", equity: "حقوق ملكية", revenue: "إيراد", expense: "مصروف" };

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

// طباعة التقرير الحالي عبر نافذة الطباعة (تُحويل تلقائيًا إلى PDF من حوار الطباعة)
const toPDF = (title, bodyNode) => {
  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) return false;
  printWindow.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 24px; color: #1e293b; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 18px; }
      table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
      th { text-align: start; padding: 8px 10px; border-bottom: 2px solid #cbd5f5; background: #f1f5f9; }
      td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
      td.num, th.num { text-align: end; }
      tfoot td { font-weight: 700; border-top: 2px solid #cbd5f5; border-bottom: none; }
      .muted { color: #94a3b8; }
      .section { margin-top: 18px; font-weight: 700; font-size: 14px; }
      .warn { color: #b91c1c; font-weight: 700; }
      .ok { color: #047857; font-weight: 700; }
    </style></head><body>${bodyNode}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 250);
  return true;
};

const fmt = (value) => Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ReportsPage = () => {
  const { currentBranch, branches } = useSettings();
  const toast = useToast();
  const [reportType, setReportType] = useState("profit-loss");
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [asOfDate, setAsOfDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [movementItems, setMovementItems] = useState([]);
  const [movementTotal, setMovementTotal] = useState(0);
  const [movementPage, setMovementPage] = useState(1);

  // Balance sheet uses a single point-in-time date instead of a period
  const isBalanceSheet = reportType === "balance-sheet";

  const effectiveBranchId = useMemo(() => {
    if (branchId) return Number(branchId);
    return currentBranch?.id || 1;
  }, [branchId, currentBranch?.id]);

  const periodLabel = useMemo(() => {
    if (isBalanceSheet) return asOfDate ? `حتى ${asOfDate}` : "حتى تاريخه";
    if (startDate && endDate) return `${startDate} ← ${endDate}`;
    if (startDate) return `من ${startDate}`;
    if (endDate) return `حتى ${endDate}`;
    return "كل الفترات";
  }, [startDate, endDate, asOfDate, isBalanceSheet]);

  const runReport = useCallback(async () => {
    setLoading(true);
    const params = isBalanceSheet
      ? { branch_id: effectiveBranchId, as_of_date: asOfDate || undefined }
      : { branch_id: effectiveBranchId, start_date: startDate || undefined, end_date: endDate || undefined };
    try {
      if (reportType === "profit-loss") {
        const response = await window.api?.reports?.profitLoss(params);
        if (response?.success) setData(response.data);
        else toast.error(response?.error);
      } else if (reportType === "trial-balance") {
        const response = await window.api?.reports?.trialBalance(params);
        if (response?.success) setData(response.data);
        else toast.error(response?.error);
      } else if (reportType === "income-statement") {
        const response = await window.api?.reports?.incomeStatement(params);
        if (response?.success) setData(response.data);
        else toast.error(response?.error);
      } else if (reportType === "balance-sheet") {
        const response = await window.api?.reports?.balanceSheet(params);
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
  }, [reportType, startDate, endDate, asOfDate, effectiveBranchId, isBalanceSheet, toast]);

  useEffect(() => { runReport(); }, [runReport]);

  const exportFilename = useMemo(() => {
    const type = REPORT_TYPES.find((r) => r.key === reportType)?.labelEn || "report";
    return isBalanceSheet
      ? `report_${type}_${asOfDate || "now"}`
      : `report_${type}_${startDate || "all"}_${endDate || "all"}`;
  }, [reportType, startDate, endDate, asOfDate, isBalanceSheet]);

  const exportCSV = () => {
    if (reportType === "profit-loss" && data) {
      toCSV([data.sales, data.purchases], exportFilename);
    } else if (reportType === "tax" && data) {
      toCSV([data], exportFilename);
    } else if (reportType === "trial-balance" && data) {
      toCSV(data.accounts.filter((a) => !a.is_summary).map((a) => ({ الرمز: a.code, الحساب: a.name, النوع: accountTypeLabels[a.account_type], مدين: a.total_debit, دائن: a.total_credit, الرصيد: a.balance })), exportFilename);
    } else if (reportType === "income-statement" && data) {
      toCSV(
        [
          ...data.revenues.filter((a) => !a.is_summary).map((a) => ({ القسم: "الإيرادات", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
          ...data.expenses.filter((a) => !a.is_summary).map((a) => ({ القسم: "المصروفات", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
        ],
        exportFilename
      );
    } else if (reportType === "balance-sheet" && data) {
      toCSV(
        [
          ...data.assets.filter((a) => !a.is_summary).map((a) => ({ القسم: "الأصول", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
          ...data.liabilities.filter((a) => !a.is_summary).map((a) => ({ القسم: "الخصوم", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
          ...data.equity.filter((a) => !a.is_summary).map((a) => ({ القسم: "حقوق الملكية", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
        ],
        exportFilename
      );
    } else if (movementItems.length) {
      toCSV(movementItems, exportFilename);
    } else {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    toast.success("تم تصدير CSV بنجاح");
  };

  const exportExcel = () => {
    if (reportType === "profit-loss" && data) {
      toExcel([data.sales, data.purchases], exportFilename);
    } else if (reportType === "tax" && data) {
      toExcel([data], exportFilename);
    } else if (reportType === "trial-balance" && data) {
      toExcel(data.accounts.filter((a) => !a.is_summary).map((a) => ({ الرمز: a.code, الحساب: a.name, النوع: accountTypeLabels[a.account_type], مدين: a.total_debit, دائن: a.total_credit, الرصيد: a.balance })), exportFilename);
    } else if (reportType === "income-statement" && data) {
      toExcel(
        [
          ...data.revenues.filter((a) => !a.is_summary).map((a) => ({ القسم: "الإيرادات", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
          ...data.expenses.filter((a) => !a.is_summary).map((a) => ({ القسم: "المصروفات", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
        ],
        exportFilename
      );
    } else if (reportType === "balance-sheet" && data) {
      toExcel(
        [
          ...data.assets.filter((a) => !a.is_summary).map((a) => ({ القسم: "الأصول", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
          ...data.liabilities.filter((a) => !a.is_summary).map((a) => ({ القسم: "الخصوم", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
          ...data.equity.filter((a) => !a.is_summary).map((a) => ({ القسم: "حقوق الملكية", الرمز: a.code, الحساب: a.name, المبلغ: a.amount })),
        ],
        exportFilename
      );
    } else if (movementItems.length) {
      toExcel(movementItems, exportFilename);
    } else {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    toast.success("تم تصدير Excel بنجاح");
  };

  const exportPDF = () => {
    const header = `<h1>${REPORT_TYPES.find((r) => r.key === reportType)?.label}</h1><div class="meta">الفرع: ${currentBranch?.name || "الفرع الرئيسي"} — ${periodLabel}</div>`;
    let body = header;
    let ok = true;

    if (reportType === "trial-balance" && data) {
      const rows = data.accounts
        .filter((a) => !a.is_summary)
        .map((a) => `<tr><td>${a.code}</td><td>${a.name}</td><td class="muted">${accountTypeLabels[a.account_type]}</td><td class="num">${fmt(a.total_debit)}</td><td class="num">${fmt(a.total_credit)}</td></tr>`)
        .join("");
      const status = data.balanced
        ? `<p class="ok">✔ ميزان المراجعة متوازن: إجمالي المدين = إجمالي الدائن = ${fmt(data.totals.debit)}</p>`
        : `<p class="warn">⚠ تنبيه: ميزان المراجعة غير متوازن. الفرق = ${fmt(data.difference)} — يرجى مراجعة القيود.</p>`;
      body += `${status}<table><thead><tr><th>الرمز</th><th>الحساب</th><th>النوع</th><th class="num">مدين</th><th class="num">دائن</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td colspan="3">الإجمالي</td><td class="num">${fmt(data.totals.debit)}</td><td class="num">${fmt(data.totals.credit)}</td></tr></tfoot></table>`;
    } else if (reportType === "income-statement" && data) {
      const revRows = data.revenues.filter((a) => !a.is_summary).map((a) => `<tr><td>${a.code}</td><td>${a.name}</td><td class="num">${fmt(a.amount)}</td></tr>`).join("");
      const expRows = data.expenses.filter((a) => !a.is_summary).map((a) => `<tr><td>${a.code}</td><td>${a.name}</td><td class="num">${fmt(a.amount)}</td></tr>`).join("");
      body += `<div class="section">الإيرادات</div><table><thead><tr><th>الرمز</th><th>الحساب</th><th class="num">المبلغ</th></tr></thead><tbody>${revRows}</tbody>
        <tfoot><tr><td colspan="2">إجمالي الإيرادات</td><td class="num">${fmt(data.total_revenue)}</td></tr></tfoot></table>
        <div class="section">المصروفات</div><table><thead><tr><th>الرمز</th><th>الحساب</th><th class="num">المبلغ</th></tr></thead><tbody>${expRows}</tbody>
        <tfoot><tr><td colspan="2">إجمالي المصروفات</td><td class="num">${fmt(data.total_expense)}</td></tr></tfoot></table>
        <div class="section">صافي ${data.is_loss ? "الخسارة" : "الربح"}: <span class="${data.is_loss ? "warn" : "ok"}">${fmt(data.net_profit)}</span></div>`;
    } else if (reportType === "balance-sheet" && data) {
      const assetRows = data.assets.filter((a) => !a.is_summary).map((a) => `<tr><td>${a.code}</td><td>${a.name}</td><td class="num">${fmt(a.amount)}</td></tr>`).join("");
      const liabRows = data.liabilities.filter((a) => !a.is_summary).map((a) => `<tr><td>${a.code}</td><td>${a.name}</td><td class="num">${fmt(a.amount)}</td></tr>`).join("");
      const eqRows = data.equity.filter((a) => !a.is_summary).map((a) => `<tr><td>${a.code}</td><td>${a.name}</td><td class="num">${fmt(a.amount)}</td></tr>`).join("");
      const status = data.balanced
        ? `<p class="ok">✔ الميزانية متوازنة: الأصول = الخصوم + حقوق الملكية = ${fmt(data.total_assets)}</p>`
        : `<p class="warn">⚠ تنبيه: الميزانية غير متوازنة. الفرق = ${fmt(data.difference)} — يرجى مراجعة القيود.</p>`;
      body += `${status}
        <div class="section">الأصول</div><table><thead><tr><th>الرمز</th><th>الحساب</th><th class="num">المبلغ</th></tr></thead><tbody>${assetRows}</tbody>
        <tfoot><tr><td colspan="2">إجمالي الأصول</td><td class="num">${fmt(data.total_assets)}</td></tr></tfoot></table>
        <div class="section">الخصوم</div><table><thead><tr><th>الرمز</th><th>الحساب</th><th class="num">المبلغ</th></tr></thead><tbody>${liabRows}</tbody>
        <tfoot><tr><td colspan="2">إجمالي الخصوم</td><td class="num">${fmt(data.total_liabilities)}</td></tr></tfoot></table>
        <div class="section">حقوق الملكية</div><table><thead><tr><th>الرمز</th><th>الحساب</th><th class="num">المبلغ</th></tr></thead><tbody>${eqRows}</tbody>
        <tfoot><tr><td colspan="2">إجمالي حقوق الملكية</td><td class="num">${fmt(data.total_equity)}</td></tr></tfoot></table>
        <div class="section">إجمالي الخصوم وحقوق الملكية: ${fmt(data.total_liabilities_and_equity)}</div>`;
    } else if (reportType === "profit-loss" && data) {
      body += `<table><thead><tr><th>البند</th><th class="num">القيمة</th></tr></thead><tbody>
        <tr><td>إجمالي المبيعات</td><td class="num">${fmt(data.sales.total)}</td></tr>
        <tr><td>إجمالي المشتريات</td><td class="num">${fmt(data.purchases.total)}</td></tr>
        <tr><td>إجمالي المصروفات</td><td class="num">${fmt(data.expenses)}</td></tr>
        <tr><td>الربح الإجمالي</td><td class="num">${fmt(data.gross_profit)}</td></tr>
        <tr><td>صافي الربح</td><td class="num">${fmt(data.net_profit)}</td></tr></tbody></table>`;
    } else if (reportType === "tax" && data) {
      body += `<table><thead><tr><th>البند</th><th class="num">القيمة</th></tr></thead><tbody>
        <tr><td>الضريبة المحصلة</td><td class="num">${fmt(data.tax_collected)}</td></tr>
        <tr><td>الضريبة المدفوعة</td><td class="num">${fmt(data.tax_paid)}</td></tr>
        <tr><td>الضريبة المستحقة</td><td class="num">${fmt(data.tax_due)}</td></tr></tbody></table>`;
    } else if (movementItems.length) {
      const rows = movementItems.map((m) => `<tr><td>${m.product_name || ""}</td><td>${m.sku || ""}</td><td>${m.movement_type}</td><td class="num">${m.quantity}</td></tr>`).join("");
      body += `<table><thead><tr><th>الصنف</th><th>الكود</th><th>نوع الحركة</th><th class="num">الكمية</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else {
      ok = false;
    }

    if (!ok) { toast.error("لا توجد بيانات للتصدير"); return; }
    if (toPDF(REPORT_TYPES.find((r) => r.key === reportType)?.label, body)) toast.success("تم فتح حوار الطباعة / حفظ PDF");
    else toast.error("تعذر فتح نافذة الطباعة (قد يكون حاجب النوافذ مفعلاً)");
  };

  const loadMovementPage = (page) => {
    window.api?.reports?.inventoryMovement({
      branch_id: effectiveBranchId,
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
      <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>التقارير</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>تقارير تحليلية قابلة للتصدير بصيغ CSV / Excel / PDF / طباعة</p></div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Select value={reportType} onChange={(e) => { setReportType(e.target.value); setData(null); }} options={REPORT_TYPES.map((r) => ({ value: r.key, label: r.label }))} style={{ minWidth: 220 }} />
          {branches && branches.length > 1 && (
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} placeholder="كل الفروع" options={branches.map((b) => ({ value: String(b.id), label: b.name }))} style={{ minWidth: 160 }} />
          )}
          {isBalanceSheet ? (
            <>
              <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>تاريخ لحظي</span>
            </>
          ) : (
            <>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span style={{ color: "var(--text-muted)" }}>إلى</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </>
          )}
          <Button icon={Search} onClick={runReport}>عرض التقرير</Button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" icon={Download} onClick={exportCSV}>تصدير CSV</Button>
          <Button variant="secondary" icon={FileText} onClick={exportExcel}>تصدير Excel</Button>
          <Button variant="secondary" icon={FileText} onClick={exportPDF}>تصدير PDF</Button>
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

      {!loading && reportType === "trial-balance" && data && (
        <Card
          title="ميزان المراجعة"
          subtitle={`الفرع: ${currentBranch?.name || "الفرع الرئيسي"} — ${periodLabel}`}
          noPadding
          action={data.balanced ? <Badge variant="success">متوازن</Badge> : <Badge variant="danger">غير متوازن</Badge>}
        >
          {!data.balanced && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 24px", backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>
              <AlertTriangle size={18} />
              تنبيه خطأ: إجمالي المدين لا يساوي إجمالي الدائن (الفرق {fmt(data.difference)}). هذا يعني وجود خطأ في القيود المحاسبية ويجب مراجعتها.
            </div>
          )}
          {data.balanced && data.totals.debit > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 24px", backgroundColor: "#ecfdf5", borderBottom: "1px solid #d1fae5", color: "#047857", fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={18} />
              ميزان المراجعة متوازن: إجمالي المدين = إجمالي الدائن = {fmt(data.totals.debit)}
            </div>
          )}
          <TrialBalanceTable data={data} />
        </Card>
      )}

      {!loading && reportType === "income-statement" && data && (
        <Card
          title="قائمة الدخل"
          subtitle={`الفرع: ${currentBranch?.name || "الفرع الرئيسي"} — ${periodLabel}`}
          noPadding
          action={<Badge variant={data.is_loss ? "danger" : "success"}>{data.is_loss ? "خسارة" : "ربح"}</Badge>}
        >
          <div style={{ padding: "8px 24px 0" }}>
            <StatementSection title="الإيرادات" rows={data.revenues} total={data.total_revenue} emptyMessage="لا توجد إيرادات في هذه الفترة" />
            <StatementSection title="المصروفات" rows={data.expenses} total={data.total_expense} emptyMessage="لا توجد مصروفات في هذه الفترة" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", margin: "14px 0", borderRadius: 12, backgroundColor: data.is_loss ? "#fef2f2" : "#ecfdf5", border: `1px solid ${data.is_loss ? "#fecaca" : "#d1fae5"}` }}>
              <strong style={{ color: data.is_loss ? "#b91c1c" : "#047857" }}>صافي {data.is_loss ? "الخسارة" : "الربح"}</strong>
              <strong style={{ color: data.is_loss ? "#b91c1c" : "#047857", fontSize: 18 }}>{fmt(data.net_profit)}</strong>
            </div>
          </div>
        </Card>
      )}

      {!loading && reportType === "balance-sheet" && data && (
        <Card
          title="الميزانية العمومية"
          subtitle={`الفرع: ${currentBranch?.name || "الفرع الرئيسي"} — ${periodLabel}`}
          noPadding
          action={data.balanced ? <Badge variant="success">متوازنة</Badge> : <Badge variant="danger">غير متوازنة</Badge>}
        >
          {!data.balanced && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 24px", backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>
              <AlertTriangle size={18} />
              تنبيه خطأ: إجمالي الأصول لا يساوي إجمالي الخصوم وحقوق الملكية (الفرق {fmt(data.difference)}). هذا يعني وجود خطأ في القيود المحاسبية ويجب مراجعتها.
            </div>
          )}
          {data.balanced && data.total_assets > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 24px", backgroundColor: "#ecfdf5", borderBottom: "1px solid #d1fae5", color: "#047857", fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={18} />
              الميزانية متوازنة: الأصول = الخصوم + حقوق الملكية = {fmt(data.total_assets)}
            </div>
          )}
          <div style={{ padding: "8px 24px 0" }}>
            <StatementSection title="الأصول" rows={data.assets} total={data.total_assets} emptyMessage="لا توجد أصول مسجلة" />
            <StatementSection title="الخصوم" rows={data.liabilities} total={data.total_liabilities} emptyMessage="لا توجد خصوم مسجلة" />
            <StatementSection title="حقوق الملكية" rows={data.equity} total={data.total_equity} emptyMessage="لا توجد حقوق ملكية مسجلة" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", margin: "14px 0", borderRadius: 12, backgroundColor: "var(--border-subtle)", border: "1px solid var(--border-color)" }}>
              <strong style={{ color: "var(--text-main)" }}>إجمالي الخصوم وحقوق الملكية</strong>
              <strong style={{ color: "var(--text-main)", fontSize: 18 }}>{fmt(data.total_liabilities_and_equity)}</strong>
            </div>
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

const TrialBalanceTable = ({ data }) => {
  const detailRows = data.accounts.filter((a) => !a.is_summary);
  if (!detailRows.length) {
    return <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>لا توجد أرصدة في هذه الفترة — تأكد من وجود قيود محاسبية مرحّلة.</div>;
  }
  const columns = [
    { key: "code", header: "الرمز", render: (value) => <strong style={{ color: "var(--primary-color)" }}>{value}</strong> },
    { key: "name", header: "الحساب" },
    { key: "account_type", header: "النوع", render: (value) => <Badge variant="info">{accountTypeLabels[value] || value}</Badge> },
    { key: "total_debit", header: "مدين", align: "end", render: (value) => <span>{fmt(value)}</span> },
    { key: "total_credit", header: "دائن", align: "end", render: (value) => <span>{fmt(value)}</span> },
    { key: "balance", header: "الرصيد", align: "end", render: (value) => <strong style={{ color: value === 0 ? "var(--text-muted)" : value > 0 ? "var(--text-main)" : "#ef4444" }}>{fmt(Math.abs(value))} {value === 0 ? "" : value > 0 ? "مدين" : "دائن"}</strong> },
  ];
  return (
    <div style={{ overflowX: "auto" }}>
      <Table columns={columns} data={detailRows} emptyMessage="لا توجد أرصدة" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, padding: "14px 24px", borderTop: "2px solid var(--border-color)", backgroundColor: "var(--border-subtle)", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, color: "var(--text-main)" }}>إجمالي المدين: <span style={{ color: data.balanced ? "#047857" : "#b91c1c" }}>{fmt(data.totals.debit)}</span></span>
        <span style={{ fontWeight: 700, color: "var(--text-main)" }}>إجمالي الدائن: <span style={{ color: data.balanced ? "#047857" : "#b91c1c" }}>{fmt(data.totals.credit)}</span></span>
      </div>
    </div>
  );
};

const StatementSection = ({ title, rows, total, emptyMessage }) => {
  const detailRows = (rows || []).filter((a) => !a.is_summary);
  return (
    <div style={{ margin: "10px 0" }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", margin: "10px 0 6px" }}>{title}</h4>
      {detailRows.length ? (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "var(--text-muted)", fontSize: 12 }}>
              <th style={{ textAlign: "start", padding: "6px 10px", borderBottom: "1px solid var(--border-color)" }}>الرمز</th>
              <th style={{ textAlign: "start", padding: "6px 10px", borderBottom: "1px solid var(--border-color)" }}>الحساب</th>
              <th style={{ textAlign: "end", padding: "6px 10px", borderBottom: "1px solid var(--border-color)" }}>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {detailRows.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border-subtle)", color: "var(--primary-color)", fontWeight: 600 }}>{row.code}</td>
                <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-main)" }}>{row.name}</td>
                <td style={{ padding: "7px 10px", textAlign: "end", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-main)", fontWeight: 600 }}>{fmt(row.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={{ padding: "8px 10px", fontWeight: 700, color: "var(--text-main)" }}>إجمالي {title}</td>
              <td style={{ padding: "8px 10px", textAlign: "end", fontWeight: 700, color: "var(--text-main)" }}>{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "6px 2px" }}>{emptyMessage}</p>
      )}
    </div>
  );
};

export default ReportsPage;
