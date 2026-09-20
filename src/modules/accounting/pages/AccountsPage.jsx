import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Edit2, Landmark, Plus, Search, Trash2, WandSparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Table from '../../../components/ui/Table';
import Tabs from '../../../components/ui/Tabs';

const emptyForm = { code: '', name: '', account_type: 'asset', parent_id: '' };
const accountTypes = { asset: 'أصل', liability: 'التزام', equity: 'حقوق ملكية', revenue: 'إيراد', expense: 'مصروف' };
const referenceLabels = {
  sales_invoice: 'فاتورة بيع',
  purchase_invoice: 'فاتورة شراء',
  payroll: 'رواتب',
  expense: 'مصروف',
  manual: 'يدوي',
};

const AccountsPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogForm, setCatalogForm] = useState({ name: '', country_code: 'CUSTOM', description: '' });

  // Journal entries state
  const [journal, setJournal] = useState([]);
  const [journalQuery, setJournalQuery] = useState('');
  const [journalLoading, setJournalLoading] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const response = await window.api?.accounts?.list({ query });
    if (response?.success) setAccounts(response.data);
    else if (response?.error) toast.error(response.error);
    setLoading(false);
  }, [query, toast]);

  const loadJournal = useCallback(async () => {
    setJournalLoading(true);
    const response = await window.api?.journal?.list({ query: journalQuery });
    if (response?.success) setJournal(response.data);
    else if (response?.error) toast.error(response.error);
    setJournalLoading(false);
  }, [journalQuery, toast]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { if (activeTab === 'journal') loadJournal(); }, [activeTab, loadJournal]);

  useEffect(() => {
    window.api?.accounts?.catalogs().then((response) => {
      if (response?.success) {
        setCatalogs(response.data);
        const active = response.data.find((catalog) => catalog.is_active);
        if (active) setSelectedCatalog(String(active.id));
      }
    });
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const saveAccount = async (event) => {
    event.preventDefault(); setSaving(true);
    const response = await window.api.accounts.save(form);
    if (response?.success) { toast.success(response.message); setModalOpen(false); loadAccounts(); }
    else toast.error(response?.error || 'تعذر حفظ الحساب');
    setSaving(false);
  };
  const deleteAccount = async () => {
    const response = await window.api.accounts.delete(deleteId);
    if (response?.success) { toast.success(response.message); loadAccounts(); }
    else toast.error(response?.error || 'تعذر حذف الحساب');
    setDeleteId(null);
  };
  const applyCatalog = async () => {
    if (!selectedCatalog) return toast.error('اختر دليلاً محاسبياً أولاً');
    const response = await window.api.accounts.applyCatalog(Number(selectedCatalog));
    if (response?.success) { toast.success(response.message); loadAccounts(); }
    else toast.error(response?.error || 'تعذر تطبيق الدليل');
  };
  const createCatalog = async (event) => {
    event.preventDefault();
    const response = await window.api.accounts.createCatalog(catalogForm);
    if (response?.success) {
      toast.success(response.message);
      setCatalogModalOpen(false);
      const catalogsResponse = await window.api.accounts.catalogs();
      if (catalogsResponse?.success) setCatalogs(catalogsResponse.data);
    } else toast.error(response?.error || 'تعذر إنشاء الدليل');
  };

  const columns = [
    { key: 'code', header: 'الرمز', render: (value) => <strong style={{ color: 'var(--primary-color)' }}>{value}</strong> },
    { key: 'name', header: 'اسم الحساب', render: (value, row) => <div><strong>{value}</strong>{row.parent_name && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>الأب: {row.parent_name}</div>}</div> },
    { key: 'account_type', header: 'النوع', render: (value) => accountTypes[value] || value },
    { key: 'is_active', header: 'الحالة', render: (value) => value ? 'نشط' : 'غير نشط' },
    { key: 'actions', header: '', align: 'end', render: (_, row) => <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}><Button size="sm" variant="ghost" icon={Edit2} onClick={() => { setForm({ ...emptyForm, ...row, parent_id: row.parent_id || '' }); setModalOpen(true); }} /><Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteId(row.id)} style={{ color: '#ef4444' }} /></div> },
  ];

  const tabsConfig = [
    { id: 'accounts', label: 'دليل الحسابات', icon: Landmark },
    { id: 'journal', label: 'القيود اليومية', icon: BookOpen },
  ];

  const formatMoney = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>الحسابات والقيود المحاسبية</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>دليل الحسابات ومراجعة القيود المرتبطة بالعمليات (فواتير، رواتب، مصروفات)</p>
      </div>

      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'accounts' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>الدليل المحاسبي</label>
              <select value={selectedCatalog} onChange={(e) => setSelectedCatalog(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                <option value="">اختر دليلاً</option>
                {catalogs.map((catalog) => <option key={catalog.id} value={catalog.id}>{catalog.name}</option>)}
              </select>
              <Button variant="secondary" size="sm" icon={WandSparkles} onClick={applyCatalog}>تطبيق</Button>
            </div>
            <Button icon={Plus} onClick={() => { setForm(emptyForm); setModalOpen(true); }}>إضافة حساب</Button>
          </div>
          <Card>
            <div style={{ marginBottom: 18 }}><Input icon={Search} placeholder="ابحث برمز الحساب أو اسمه" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <Table columns={columns} data={accounts} loading={loading} emptyMessage="لا توجد حسابات مسجلة" />
          </Card>
        </>
      )}

      {activeTab === 'journal' && (
        <Card>
          <div style={{ marginBottom: 18 }}><Input icon={Search} placeholder="ابحث برقم القيد أو الوصف" value={journalQuery} onChange={(e) => setJournalQuery(e.target.value)} /></div>
          {journalLoading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>جاري التحميل...</p>
          ) : journal.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {journal.map((entry) => {
                const balanced = Math.abs(Number(entry.total_debit || 0) - Number(entry.total_credit || 0)) < 0.01;
                const isExpanded = expandedEntry === entry.id;
                return (
                  <div key={entry.id} style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: 'none', cursor: 'pointer', textAlign: 'start' }}
                    >
                      <strong style={{ color: 'var(--primary-color)', minWidth: 130 }}>{entry.entry_number}</strong>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 90 }}>{entry.date}</span>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-main)' }}>{entry.description || '—'}</span>
                      {entry.reference_type ? <span style={{ fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '2px 8px' }}>{referenceLabels[entry.reference_type] || entry.reference_type}</span> : null}
                      <span style={{ fontSize: 12, fontWeight: 700, color: balanced ? '#10b981' : '#ef4444' }}>
                        {balanced ? 'متوازن' : 'غير متوازن'} ({formatMoney(entry.total_debit)} / {formatMoney(entry.total_credit)})
                      </span>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '8px 16px 14px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                              <th style={{ textAlign: 'start', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>الحساب</th>
                              <th style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>مدين</th>
                              <th style={{ textAlign: 'end', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>دائن</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(entry.lines || []).map((line) => (
                              <tr key={line.id}>
                                <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}>
                                  <strong>{line.account_code}</strong> — {line.account_name || 'حساب محذوف'}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'end', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}>{line.debit ? formatMoney(line.debit) : '—'}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'end', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}>{line.credit ? formatMoney(line.credit) : '—'}</td>
                              </tr>
                            ))}
                            <tr>
                              <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-main)' }}>الإجمالي</td>
                              <td style={{ padding: '8px', textAlign: 'end', fontWeight: 700, color: 'var(--text-main)' }}>{formatMoney(entry.total_debit)}</td>
                              <td style={{ padding: '8px', textAlign: 'end', fontWeight: 700, color: 'var(--text-main)' }}>{formatMoney(entry.total_credit)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>لا توجد قيود مسجلة بعد. يتم إنشاء القيد تلقائياً عند حفظ فاتورة بيع أو شراء أو رواتب.</p>
          )}
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'تعديل الحساب' : 'إضافة حساب جديد'}>
        <form onSubmit={saveAccount} style={{ display: 'grid', gap: 14 }}>
          <Input label="رمز الحساب" required value={form.code} onChange={(e) => update('code', e.target.value)} />
          <Input label="اسم الحساب" required value={form.name} onChange={(e) => update('name', e.target.value)} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>نوع الحساب
            <select value={form.account_type} onChange={(e) => update('account_type', e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
              {Object.entries(accountTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>الحساب الأب
            <select value={form.parent_id} onChange={(e) => update('parent_id', e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
              <option value="">بدون</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button type="submit" icon={Plus} loading={saving}>حفظ الحساب</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={catalogModalOpen} onClose={() => setCatalogModalOpen(false)} title="إضافة دليل محاسبي مخصص">
        <form onSubmit={createCatalog} style={{ display: 'grid', gap: 14 }}>
          <Input label="اسم الدليل" required value={catalogForm.name} onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })} />
          <Input label="وصف الدليل" value={catalogForm.description} onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setCatalogModalOpen(false)}>إلغاء</Button>
            <Button type="submit" icon={Landmark}>حفظ الدليل</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteAccount}
        title="تأكيد حذف الحساب"
        message="هل أنت متأكد من رغبتك في حذف هذا الحساب؟"
        loading={saving}
      />
    </div>
  );
};

export default AccountsPage;
