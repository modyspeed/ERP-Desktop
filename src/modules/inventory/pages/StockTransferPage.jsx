import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight, Plus, Search } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";

const StockTransferPage = () => {
  const { currentBranch } = useSettings();
  const toast = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ from_warehouse_id: "", to_warehouse_id: "", product_id: "", qty: 1 });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transfers, setTransfers] = useState({ items: [], total: 0 });

  const loadLists = useCallback(async () => {
    const whRes = await window.api?.warehouses?.search({ branch_id: currentBranch?.id || 1, limit: 100 });
    if (whRes?.success) setWarehouses(whRes.data.items);
    const prodRes = await window.api?.products?.search({ branch_id: currentBranch?.id || 1, limit: 100 });
    if (prodRes?.success) setProducts(prodRes.data.items);
  }, [currentBranch?.id]);

  useEffect(() => { loadLists(); }, [loadLists]);

  const addToCart = () => {
    if (!form.product_id || !form.from_warehouse_id || !form.to_warehouse_id) return;
    if (form.from_warehouse_id === form.to_warehouse_id) return toast.error("لا يمكن التحويل لنفس المستودع");
    const product = products.find((p) => String(p.id) === form.product_id);
    if (!product) return;
    const existing = cart.find((item) => item.product_id === form.product_id && item.from_warehouse_id === form.from_warehouse_id && item.to_warehouse_id === form.to_warehouse_id);
    if (existing) {
      setCart((current) => current.map((item) => item.product_id === form.product_id && item.from_warehouse_id === form.from_warehouse_id && item.to_warehouse_id === form.to_warehouse_id ? { ...item, qty: Number(item.qty) + Number(form.qty) } : item));
    } else {
      setCart((current) => [...current, { product_id: String(product.id), name: product.name, from_warehouse_id: form.from_warehouse_id, to_warehouse_id: form.to_warehouse_id, qty: Number(form.qty) }]);
    }
    setForm({ from_warehouse_id: "", to_warehouse_id: "", product_id: "", qty: 1 });
  };

  const doTransfer = async (event) => {
    event.preventDefault();
    if (!cart.length) return toast.error("أضف صنفاً واحداً على الأقل");
    setSaving(true);
    const response = await window.api?.warehouses?.transfer({
      branch_id: currentBranch?.id || 1,
      from_warehouse_id: Number(form.from_warehouse_id) || cart[0].from_warehouse_id,
      to_warehouse_id: Number(form.to_warehouse_id) || cart[0].to_warehouse_id,
      items: cart,
      notes: "",
      created_by: null,
    });
    if (response?.success) { toast.success(response.message); setCart([]); loadTransfers(); }
    else toast.error(response?.error);
    setSaving(false);
  };

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    // Get transfers from stock_movements via a generic API or direct call
    const response = await window.api?.warehouses?.stock(cart[0]?.from_warehouse_id || 1);
    if (response?.success) {
      // Just show current stock as info
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTransfers(); }, [loadTransfers]);

  const columns = [
    { key: "name", header: "الصنف", render: (value) => <strong>{value}</strong> },
    { key: "from_warehouse_name', header: 'من مستودع', render: (value, row) => warehouses.find(w => String(w.id) === String(row.from_warehouse_id))?.name || value },
    { key: 'to_warehouse_name', header: 'إلى مستودع', render: (value, row) => warehouses.find(w => String(w.id) === String(row.to_warehouse_id))?.name || value },
    { key: 'qty', header: 'الكمية', align: 'center' },
  ];

  const transferColumns = [
    { key: "product_name", header: "الصنف", render: (value) => <strong>{value}</strong> },
    { key: "from_warehouse_name", header: "من مستودع", render: (value, row) => warehouses.find((w) => String(w.id) === String(row.from_warehouse_id))?.name || value },
    { key: "to_warehouse_name", header: "إلى مستودع", render: (value, row) => warehouses.find((w) => String(w.id) === String(row.to_warehouse_id))?.name || value },
    { key: "qty", header: "الكمية", align: "center" },
  ];

  const displayItems = cart.map((item) => ({
    ...item,
    from_warehouse_name: warehouses.find((w) => String(w.id) === String(item.from_warehouse_id))?.name,
    to_warehouse_name: warehouses.find((w) => String(w.id) === String(item.to_warehouse_id))?.name,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>تحويل المخزون</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>تحويل أصناف بين المستودعات</p></div>
      <Card>
        <form onSubmit={doTransfer} style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", flex: 1, minWidth: 180 }}>
            من مستودع
            <Select value={form.from_warehouse_id} onChange={(e) => setForm({ ...form, from_warehouse_id: e.target.value })} options={[{ value: "", label: "اختر مستودع" }, ...warehouses.map((w) => ({ value: String(w.id), label: w.name }))]} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", flex: 1, minWidth: 180 }}>
            إلى مستودع
            <Select value={form.to_warehouse_id} onChange={(e) => setForm({ ...form, to_warehouse_id: e.target.value })} options={[{ value: "", label: "اختر مستودع" }, ...warehouses.map((w) => ({ value: String(w.id), label: w.name }))]} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", flex: 1, minWidth: 180 }}>
            الصنف
            <Select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} options={[{ value: "", label: "اختر صنفاً" }, ...products.map((p) => ({ value: String(p.id), label: p.name }))]} />
          </label>
          <Input label="الكمية" type="number" min="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={{ width: 100 }} />
          <Button type="button" icon={Plus} onClick={addToCart}>إضافة</Button>
          <Button type="submit" icon={ArrowLeftRight} loading={saving}>تحويل</Button>
        </form>
      </Card>
      {cart.length > 0 && (
        <Card title={`الأصناف المختارة (${cart.length})`}>
          <Table columns={transferColumns} data={displayItems} loading={loading} emptyMessage="لا توجد أصناف" />
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 0" }}><Button variant="secondary" onClick={() => setCart([])}>مسح الكل</Button></div>
        </Card>
      )}
    </div>
  );
};

export default StockTransferPage;
