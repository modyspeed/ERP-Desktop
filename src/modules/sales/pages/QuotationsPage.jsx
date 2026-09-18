import React, { useCallback, useEffect, useState } from "react";
import { ClipboardList, FileText, Plus, Printer, Search, Trash2 } from "lucide-react";
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
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

const emptyForm = { customer_id: "", quote_date: new Date().toISOString().split("T")[0], expiry_date: "", notes: "" };
const emptyItem = { product_id: "", qty: 1, unit_price: 0, discount: 0, tax: 0 };

const QuotationsPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [result, setResult] = useState({ items: [], total: 0 });
  const [options, setOptions] = useState({ customers: [], products: [] });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [cart, setCart] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [convertId, setConvertId] = useState(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    const response = await window.api?.quotations?.search({ query, branch_id: currentBranch?.id || 1, page: 1, limit: 20 });
    if (response?.success) setResult(response.data);
    else toast.error(response?.error);
    setLoading(false);
  }, [currentBranch?.id, query, toast]);

  const loadOptions = useCallback(async () => {
    const response = await window.api?.quotations?.options(currentBranch?.id || 1);
    if (response?.success) setOptions(response.data);
  }, [currentBranch?.id]);

  useEffect(() => { loadQuotations(); loadOptions(); }, [loadQuotations, loadOptions]);

  const openCreate = () => { setForm(emptyForm); setCart([]); setEditingId(null); setModalOpen(true); };
  const openEdit = async (quotation) => {
    setForm({ ...emptyForm, customer_id: String(quotation.customer_id), quote_date: quotation.date, expiry_date: quotation.expiry_date || "", notes: quotation.notes || "" });
    setEditingId(quotation.id);
    setModalOpen(true);
    const res = await window.api?.quotations?.get(quotation.id);
    if (res?.success) {
      setCart((res.data.items || []).map((item) => ({ product_id: String(item.product_id), name: item.product_name || "", qty: item.qty, unit_price: item.unit_price, discount: item.discount || 0, tax: item.tax || 0 })));
    }
  };

  const addToCart = () => {
    const product = options.products.find((p) => String(p.id) === form.product_id);
    if (!product || Number(form.qty || 0) <= 0) return;
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) return current.map((item) => item.product_id === product.id ? { ...item, qty: Number(item.qty) + Number(form.qty) } : item);
      return [...current, { product_id: String(product.id), name: product.name, qty: Number(form.qty), unit_price: Number(product.sale_price || 0), discount: 0, tax: 0 }];
    });
    setForm((current) => ({ ...current, product_id: "", qty: 1 }));
  };

  const saveQuotation = async (event) => {
    event.preventDefault();
    if (!cart.length) return toast.error("أضف صنفاً واحداً على الأقل");
    setSaving(true);
    const subtotal = cart.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
    const response = await window.api?.quotations?.save({
      ...form,
      branch_id: currentBranch?.id || 1,
      id: editingId || undefined,
      date: form.quote_date,
      total_amount: subtotal,
      items: cart,
    });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadQuotations(); }
    else toast.error(response?.error);
    setSaving(false);
  };

  const convertToInvoice = async () => {
    if (!convertId) return;
    setConvertLoading(true);
    const response = await window.api?.quotations?.convertToInvoice({ quotation_id: convertId });
    if (response?.success) { toast.success(response.message || "تم التحويل"); setConvertId(null); loadQuotations(); }
    else toast.error(response?.error);
    setConvertLoading(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);

  const columns = [
    { key: "quote_number", header: "رقم العرض", render: (value) => <strong>{value}</strong> },
    { key: "customer_name", header: "العميل" },
    { key: "date", header: "التاريخ" },
    { key: "total_amount", header: "الإجمالي", align: "end", render: (value) => Number(value || 0).toFixed(2) },
    { key: "status", header: "الحالة", render: (value) => <Badge variant={value === "converted" ? "danger" : value === "approved" ? "success" : "default"}>{value === "converted" ? "محول" : value === "approved" ? "موافق" : "مسودة"}</Badge> },
    { key: "actions", header: "", align: "end", render: (_, row) => <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}><Button size="sm" variant="ghost" icon={FileText} onClick={() => openEdit(row)} title="تعديل" /><Button size="sm" variant="ghost" icon={Printer} onClick={() => window.print()} title="طباعة" /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: "#ef4444" }} /></div> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>عروض الأسعار</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>عروض الأسعار للعملاء مع إمكانية التحويل لفاتورة بيع</p></div>
        <Button icon={Plus} onClick={openCreate}>عرض جديد</Button>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}><Input icon={Search} placeholder="ابحث برقم العرض أو اسم العميل" value={query} onChange={(event) => setQuery(event.target.value)} /><span style={{ color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: 13 }}>{result.total || 0} عرض</span></div>
        <Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد عروض أسعار" />
        <Pagination currentPage={result.page} totalPages={result.totalPages} totalItems={result.total} onPageChange={() => {}} />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'تعديل عرض أسعار' : 'عرض أسعار جديد'} maxWidth="900px">
        <form onSubmit={saveQuotation} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>العميل<Select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} options={[{ value: "", label: "اختر عميلاً" }, ...options.customers.map((c) => ({ value: String(c.id), label: c.name }))]} /></label>
            <Input label="تاريخ العرض" type="date" value={form.quote_date} onChange={(e) => setForm({ ...form, quote_date: e.target.value })} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <Select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} options={[{ value: "", label: "اختر صنفاً" }, ...options.products.map((p) => ({ value: String(p.id), label: `${p.name} - ${p.sale_price} ر.س` }))]} style={{ flex: 1 }} />
            <Input label="الكمية" type="number" min="1" value={form.qty || 1} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={{ width: 100 }} />
            <Button type="button" icon={Plus} onClick={addToCart}>إضافة</Button>
          </div>
          {cart.length > 0 && (
            <div style={{ border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 40px", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" }}>
                  <span>{item.name}</span>
                  <span>{item.qty} × {Number(item.unit_price).toFixed(2)}</span>
                  <strong style={{ textAlign: "end" }}>{(item.qty * item.unit_price).toFixed(2)}</strong>
                  <Button type="button" variant="ghost" icon={Trash2} onClick={() => setCart((current) => current.filter((_, i) => i !== idx))} style={{ color: "#ef4444" }} />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            <div style={{ padding: "12px 14px", border: "1px solid var(--border-color)", borderRadius: 10 }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>الإجمالي</span><br/><strong style={{ fontSize: 20, color: "var(--primary-color)" }}>{subtotal.toFixed(2)}</strong>
            </div>
            <Input label="ملاحظات" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={ClipboardList} loading={saving}>حفظ العرض</Button></div>
        </form>
      </Modal>
      {convertId && (
        <Modal isOpen={!!convertId} onClose={() => setConvertId(null)} title="تحويل العرض لفاتورة بيع" maxWidth="400px" footer={
          <><Button variant="secondary" onClick={() => setConvertId(null)}>إلغاء</Button><Button onClick={convertToInvoice} loading={convertLoading} style={{ backgroundColor: '#10b981' }}>تحويل لفاتورة</Button></>
        }>
          <p style={{ color: "var(--text-muted)" }}>هل أنت متأكد من تحويل هذا العرض لفاتورة بيع؟ سيتم تحديث المخزون تلقائياً.</p>
        </Modal>
      )}
    </div>
  );
};

export default QuotationsPage;
