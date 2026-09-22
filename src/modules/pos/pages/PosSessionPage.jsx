import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Lock, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const PosSessionPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentBranch } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.api?.pos?.activeSession({
        cashier_id: user?.id,
        branch_id: currentBranch?.id || 1,
      });
      if (response?.success) {
        setSession(response.data);
      } else {
        setSession(null);
        if (response?.error) toast.error(response.error);
      }
    } catch (err) {
      toast.error(err?.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentBranch?.id, toast]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const expectedBalance = session
    ? Number(session.opening_balance || 0) + Number(session.cash_sales || 0)
    : 0;
  const closingValue = closingBalance === '' ? expectedBalance : Number(closingBalance || 0);
  const difference = closingValue - expectedBalance;

  const startSession = async (event) => {
    event.preventDefault();
    const amount = Number(openingBalance || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error(t('pos.openingBalance') + ' ' + t('common.invalid'));
      return;
    }
    setBusy(true);
    try {
      const response = await window.api?.pos?.openSession({
        cashier_id: user?.id,
        branch_id: currentBranch?.id || 1,
        opening_balance: amount,
      });
      if (response?.success) {
        toast.success(response.message);
        navigate('/pos', { replace: true });
      } else {
        toast.error(response?.error);
      }
    } catch (err) {
      toast.error(err?.message);
    } finally {
      setBusy(false);
    }
  };

  const closeSession = async (event) => {
    event.preventDefault();
    if (!session?.id) return;
    const amount = Number(closingBalance === '' ? expectedBalance : closingBalance || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error(t('pos.closingBalance') + ' ' + t('common.invalid'));
      return;
    }
    setBusy(true);
    try {
      const response = await window.api?.pos?.closeSession({
        id: session.id,
        closing_balance: amount,
      });
      if (response?.success) {
        toast.success(response.message || t('pos.sessionClosed'));
        setSession(null);
        setClosingBalance('');
        setOpeningBalance('0');
      } else {
        toast.error(response?.error);
      }
    } catch (err) {
      toast.error(err?.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner text={t('common.loading')} size={36} />
      </div>
    );
  }

  // حالة الفتح: لا توجد وردية مفتوحة لهذا الكاشير
  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
        <Card style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--primary-light)',
                color: 'var(--primary-color)',
              }}
            >
              <Wallet size={28} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{t('pos.sessionRequired')}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400 }}>{t('pos.sessionRequiredHint')}</p>
          </div>

          <form onSubmit={startSession} style={{ display: 'grid', gap: 16, marginTop: 20 }}>
            <Input
              label={t('pos.openingBalance')}
              type="number"
              min="0"
              step="0.01"
              required
              autoFocus
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
            />
            <Button type="submit" icon={Lock} loading={busy} size="lg">
              {t('pos.startSession')}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // حالة الإغلاق: توجد وردية مفتوحة — اعرض التسوية
  const differenceTone = Math.abs(difference) < 0.005 ? '#10b981' : difference < 0 ? '#ef4444' : '#d97706';
  const differenceLabel =
    Math.abs(difference) < 0.005
      ? t('pos.differenceZero')
      : difference < 0
        ? t('pos.differenceShort')
        : t('pos.differenceOver');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
      <Card style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
            }}
          >
            <Wallet size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{t('pos.closeSessionTitle')}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420 }}>{t('pos.closeSessionHint')}</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            marginTop: 20,
          }}
        >
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 12 }}>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{t('pos.sessionOpenedAt')}</span>
            <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>{formatTime(session.opened_at)}</strong>
          </div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 12 }}>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{t('pos.openingBalance')}</span>
            <strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{formatMoney(session.opening_balance)}</strong>
          </div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 12 }}>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{t('pos.cashSales')}</span>
            <strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{formatMoney(session.cash_sales)}</strong>
          </div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 12 }}>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{t('pos.transactionsCount')}</span>
            <strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{session.transactions_count}</strong>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
            padding: '14px 16px',
            borderRadius: 12,
            border: '1px dashed var(--border-color)',
            background: 'var(--bg-app)',
          }}
        >
          <div>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{t('pos.expectedBalance')}</span>
            <strong style={{ fontSize: 20, color: 'var(--text-main)' }}>{formatMoney(expectedBalance)}</strong>
          </div>
          <div style={{ textAlign: 'end' }}>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{t('pos.difference')}</span>
            <strong style={{ fontSize: 20, color: differenceTone }}>{formatMoney(difference)}</strong>
            <span style={{ display: 'block', fontSize: 11, color: differenceTone, fontWeight: 700 }}>{differenceLabel}</span>
          </div>
        </div>

        <form onSubmit={closeSession} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <Input
            label={t('pos.closingBalance')}
            type="number"
            min="0"
            step="0.01"
            required
            value={closingBalance}
            placeholder={expectedBalance.toFixed(2)}
            onChange={(event) => setClosingBalance(event.target.value)}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button type="submit" variant="danger" icon={LogOut} loading={busy} size="lg" style={{ flex: 1 }}>
              {t('pos.confirmClose')}
            </Button>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/pos', { replace: true })}>
              {t('common.back')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PosSessionPage;
