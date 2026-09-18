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

const emptyForm = { supplier_id: "", po_date: new Date().toISOString().split("T")[0], notes: "" };
const emptyItem = { product_id: "", qty: 1, unit_cost: 0 };

const PurchaseOrdersPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [result, setResult] = useState({ items: [], total: 0 });
  const [options, setOptions] = useState({ suppliers: [], products: [] });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [cart, setCart] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [convertId, setConvertId] = useState(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPOs = useCallback(async () => {
    setLoading(true);
    const response = await window.api?.purchaseOrders?.search({ query, branch_id: currentBranch?.id || 1, page: 1, limit: 20 });
    if (response?.success) setResult(response.data);
    else toast.error(response?.error);
    setLoading(false);
  }, [currentBranch?.id, query, toast]);

  const loadOptions = useCallback(async () => {
    const supRes = await window.api?.suppliers?.search({ branch_id: currentBranch?.id || 1, limit: 100 });
    if (supRes?.success) setOptions((current) => ({ ...current, suppliers: supRes.data.items || [] }));
    const prodRes = await window.api?.products?.search({ branch_id: currentBranch?.id || 1, limit: 100 });
    if (prodRes?.success) setOptions((current) => ({ ...current, products: prodRes.data.items || [] }));
  }, [currentBranch?.id]);

  useEffect(() => { loadPOs(); loadOptions(); }, [loadPOs, loadOptions]);

  const openCreate = () => { setForm(emptyForm); setCart([]); setEditingId(null); setModalOpen(true); };
  const openEdit = async (po) => {
    setForm({ ...emptyForm, supplier_id: String(po.supplier_id), po_date: po.date, notes: po.notes || "" });
    setEditingId(po.id);
    setModalOpen(true);
    const res = await window.api?.purchaseOrders?.get(po.id);
    if (res?.success) {
      setCart((res.data.items || []).map((item) => ({ product_id: String(item.product_id), name: item.product_name, qty: item.qty, unit_cost: item.unit_cost })));
    }
  };

  const addToCart = () => {
    const product = options.products.find((p) => String(p.id) === form.product_id);
    if (!product || Number(form.qty || 0) <= 0) return;
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) return current.map((item) => item.product_id === product.id ? { ...item, qty: Number(item.qty) + Number(form.qty) } : item);
      return [...current, { product_id: String(product.id), name: product.name, qty: Number(form.qty), unit_cost: Number(product.cost_price || 0) }];
    });
    setForm((current) => ({ ...current, product_id: "", qty: 1 }));
  };

  const savePO = async (event) => {
    event.preventDefault();
    if (!cart.length) return toast.error("أضف صنفاً واحداً على الأقل");
    setSaving(true);
    const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.unit_cost), 0);
    const response = await window.api?.purchaseOrders?.save({
      ...form,
      branch_id: currentBranch?.id || 1,
      id: editingId || undefined,
      date: form.po_date,
      total_amount: subtotal,
      items: cart,
    });
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadPOs(); }
    else toast.error(response?.error);
    setSaving(false);
  };

  const convertToInvoice = async () => {
    if (!convertId) return;
    setConvertLoading(true);
    const response = await window.api?.purchaseOrders?.convertToInvoice({ po_id: convertId });
    if (response?.success) { toast.success(response.message || "تم التحويل"); setConvertId(null); loadPOs(); }
    else toast.error(response?.error);
    setConvertLoading(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.unit_cost), 0);

  const columns = [
    { key: "po_number", header: "رقم الأمر", render: (value) => <strong>{value}</strong> },
    { key: "supplier_name", header: "المورد" },
    { key: "date", header: "التاريخ" },
    { key: "total_amount", header: "الإجمالي", align: "end", render: (value) => Number(value || 0).toFixed(2) },
    { key: "status", header: "الحالة", render: (value) => <Badge variant={value === "invoiced" ? "success" : "default"}>{value === "invoiced" ? "مُفوترة" : "معلق"}</Badge> },
    { key: "actions", header: "", align: "end", render: (_, row) => <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}><Button size="sm" variant="ghost" icon={FileText} onClick={() => openEdit(row)} title="تعديل" /><Button size="sm" variant="ghost" icon={Printer} onClick={() => window.print()} title="طباعة" /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => {}} style={{ color: "#ef4444" }} /></div> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>أوامر الشراء</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>أوامر شراء من الموردين مع تحويل لفواتير</p></div>
        <Button icon={Plus} onClick={openCreate}>أمر شراء جديد</Button>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}><Input icon={Search} placeholder="ابحث برقم الأمر أو اسم المورد" value={query} onChange={(event) => setQuery(event.target.value)} /><span style={{ color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: 13 }}>{result.total || 0} أمر</span></div>
        <Table columns={columns} data={result.items} loading={loading} emptyMessage="لا توجد أوامر شراء" />
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'تعديل أمر شراء' : 'أمر شراء جديد'} maxWidth="900px">
        <form onSubmit={savePO} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>المورد<Select required value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} options={[{ value: "", label: "اختر موردًا" }, ...options.suppliers.map((s) => ({ value: String(s.id), label: s.name }))]} /></label>
          <Input label="تاريخ الأمر" type="date" value={form.po_date} onChange={(e) => setForm({ ...form, po_date: e.target.value })} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <Select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} options={[{ value: "", label: "اختر صنفاً" }, ...options.products.map((p) => ({ value: String(p.id), label: `${p.name} - ${p.cost_price} ر.س` }))]} style={{ flex: 1 }} />
            <Input label="الكمية" type="number" min="1" value={form.qty || 1} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={{ width: 100 }} />
            <Button type="button" icon={Plus} onClick={addToCart}>إضافة</Button>
          </div>
          {cart.length > 0 && (
            <div style={{ border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 40px", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" }}>
                  <span>{item.name}</span><span>{item.qty} × {Number(item.unit_cost).toFixed(2)}</span>
                  <strong style={{ textAlign: "end" }}>{(item.qty * item.unit_cost).toFixed(2)}</strong>
                  <Button type="button" variant="ghost" icon={Trash2} onClick={() => setCart((current) => current.filter((_, i) => i !== idx))} style={{ color: "#ef4444" }} />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <div style={{ padding: "12px 14px", border: "1px solid var(--border-color)", borderRadius: 10 }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>الإجمالي</span><br/><strong style={{ fontSize: 20, color: "var(--primary-color)" }}>{subtotal.toFixed(2)}</strong>
            </div>
            <Input label="ملاحظات" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" icon={ClipboardList} loading={saving}>حفظ الأمر</Button></div>
        </form>
      </Modal>
      {convertId && (
        <Modal isOpen={!!convertId} onClose={() => setConvertId(null)} title="تحويل أمر الشراء لفاتورة" maxWidth="400px" footer={
          <><Button variant="secondary" onClick={() => setConvertId(null)}>إلغاء</Button><Button onClick={convertToInvoice} loading={convertLoading} style={{ backgroundColor: '#10b981' }}>تحويل لفاتورة</Button></>
        }>
          <p style={{ color: "var(--text-muted)" }}>هل أنت متأكد من تحويل هذا الأمر لفاتورة شراء؟ سيتم تحديث المخزون تلقائياً.</p>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
