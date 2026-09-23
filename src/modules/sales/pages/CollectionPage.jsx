import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, CreditCard, HandCoins } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Table from '../../../components/ui/Table';

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusLabel = (value) =>
  value === 'paid' ? 'مسددة' : value === 'partial' ? 'جزئية' : 'آجلة';

const CollectionPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentBranch } = useSettings();
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posSession, setPosSession] = useState(null);
  const [collecting, setCollecting] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    const response = await window.api?.sales?.options(currentBranch?.id || 1);
    if (response?.success) setCustomers(response.data?.customers || []);
  }, [currentBranch?.id]);

  const loadSession = useCallback(async () => {
    try {
      const response = await window.api?.pos?.activeSession({ cashier_id: user?.id });
      if (response?.success) setPosSession(response.data);
      else setPosSession(null);
    } catch {
      setPosSession(null);
    }
  }, [user?.id]);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.api?.sales?.unpaidInvoices({
        branch_id: currentBranch?.id || 1,
        customer_id: customerId || undefined,
      });
      if (response?.success) setInvoices(response.data || []);
      else if (response?.error) toast.error(response.error);
    } catch (err) {
      toast.error(err?.message);
    } finally {
      setLoading(false);
    }
  }, [currentBranch?.id, customerId, toast]);

  useEffect(() => {
    loadCustomers();
    loadSession();
  }, [loadCustomers, loadSession]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const remaining = Number(collecting?.remaining_amount || 0);
  const amountValue = amount === '' ? remaining : Number(amount || 0);

  const openCollect = (invoice) => {
    setCollecting(invoice);
    setAmount('');
    setPaymentMethod('cash');
  };

  const submitCollect = async (event) => {
    event.preventDefault();
    if (!collecting) return;
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error(t('collections.amountInvalid'));
      return;
    }
    if (amountValue > remaining + 0.01) {
      toast.error(t('collections.amountExceeds'));
      return;
    }
    setSaving(true);
    const response = await window.api?.sales?.collectPayment({
      invoice_id: collecting.id,
      amount: amountValue,
      payment_method: paymentMethod,
      pos_session_id: posSession?.id || undefined,
    });
    if (response?.success) {
      toast.success(response.message);
      setCollecting(null);
      loadInvoices();
      loadSession();
    } else {
      toast.error(response?.error || t('collections.failed'));
    }
    setSaving(false);
  };

  const columns = [
    { key: 'invoice_number', header: t('collections.invoiceNumber'), render: (value) => <strong>{value}</strong> },
    { key: 'customer_name', header: t('collections.customer'), render: (value) => value || t('pos.walkInCustomer') },
    { key: 'date', header: t('collections.date') },
    {
      key: 'total',
      header: t('collections.total'),
      align: 'end',
      render: (value) => formatMoney(value),
    },
    {
      key: 'paid_amount',
      header: t('collections.paid'),
      align: 'end',
      render: (value) => formatMoney(value),
    },
    {
      key: 'remaining_amount',
      header: t('collections.remaining'),
      align: 'end',
      render: (value) => <strong style={{ color: '#d97706' }}>{formatMoney(value)}</strong>,
    },
    {
      key: 'payment_status',
      header: t('collections.status'),
      render: (value) => (
        <span style={{ color: value === 'partial' ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
          {statusLabel(value)}
        </span>
      ),
    },
    {
      key: 'collect',
      header: '',
      align: 'end',
      render: (_, row) => (
        <Button size="sm" icon={HandCoins} onClick={() => openCollect(row)}>
          {t('collections.collect')}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>
            {t('collections.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{t('collections.subtitle')}</p>
        </div>
        {posSession && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#10b981',
              border: '1px solid #10b981',
              borderRadius: 9999,
              padding: '6px 12px',
            }}
          >
            {t('collections.sessionLinked')}
          </span>
        )}
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              minWidth: 260,
              flexGrow: 1,
            }}
          >
            {t('collections.customer')}
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              style={{
                padding: '10px 14px',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
              }}
            >
              <option value="">{t('collections.allCustomers')}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 13, alignSelf: 'flex-end' }}>
            {invoices.length} {t('collections.invoiceCount')}
          </span>
        </div>
        <Table
          columns={columns}
          data={invoices}
          loading={loading}
          emptyMessage={t('collections.empty')}
        />
      </Card>

      <Modal
        isOpen={Boolean(collecting)}
        onClose={() => setCollecting(null)}
        title={t('collections.collectTitle')}
        subtitle={collecting ? `${collecting.invoice_number} — ${collecting.customer_name || t('pos.walkInCustomer')}` : ''}
        maxWidth="520px"
      >
        <form onSubmit={submitCollect} style={{ display: 'grid', gap: 16 }}>
          {collecting && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  {t('collections.total')}
                </span>
                <strong style={{ color: 'var(--text-main)' }}>{formatMoney(collecting.total)}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  {t('collections.paid')}
                </span>
                <strong style={{ color: 'var(--text-main)' }}>{formatMoney(collecting.paid_amount)}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  {t('collections.remaining')}
                </span>
                <strong style={{ color: '#d97706' }}>{formatMoney(collecting.remaining_amount)}</strong>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { id: 'cash', label: t('pos.methodCash'), icon: Banknote },
              { id: 'card', label: t('pos.methodCard'), icon: CreditCard },
            ].map((option) => {
              const Icon = option.icon;
              const active = paymentMethod === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentMethod(option.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: `1px solid ${active ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    backgroundColor: active ? 'var(--primary-light)' : 'var(--bg-surface)',
                    color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={16} />
                  {option.label}
                </button>
              );
            })}
          </div>

          <Input
            label={t('collections.amount')}
            type="number"
            min="0.01"
            step="0.01"
            max={remaining}
            required
            autoFocus
            value={amount}
            placeholder={remaining.toFixed(2)}
            onChange={(event) => setAmount(event.target.value)}
            helperText={`${t('collections.remaining')}: ${formatMoney(remaining)}`}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAmount(remaining.toFixed(2))}
            >
              {t('collections.fullAmount')}
            </Button>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="ghost" onClick={() => setCollecting(null)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" icon={HandCoins} loading={saving}>
                {t('collections.confirm')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CollectionPage;
