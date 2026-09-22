import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Armchair, Plus, Receipt, Trash2, Users } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const STATUS_FLOW = {
  available: 'occupied',
  occupied: 'reserved',
  reserved: 'available',
};

const STATUS_COLORS = {
  available: { base: '#16a34a', soft: '#dcfce7', glow: 'rgba(22, 163, 74, 0.18)' },
  occupied: { base: '#dc2626', soft: '#fee2e2', glow: 'rgba(220, 38, 38, 0.18)' },
  reserved: { base: '#d97706', soft: '#fef3c7', glow: 'rgba(217, 119, 6, 0.18)' },
};

const emptyForm = { table_number: '', seats_count: 2 };

const TablesPage = () => {
  const { t } = useTranslation();
  const { currentBranch, settings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const isRestaurant = settings?.business_type === 'restaurants_cafes';

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await window.api?.tables?.list({ branch_id: currentBranch?.id || 1 });
      if (response?.success) setTables(response.data);
      else toast.error(response?.error);
    } catch (err) {
      toast.error(err?.message);
    } finally {
      setLoading(false);
    }
  }, [currentBranch?.id, toast]);

  useEffect(() => {
    if (isRestaurant) loadTables();
  }, [isRestaurant, loadTables]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (table) => {
    setForm({ table_number: String(table.table_number ?? ''), seats_count: table.seats_count ?? 2 });
    setEditingId(table.id);
    setModalOpen(true);
  };

  const saveTable = async (event) => {
    event.preventDefault();
    if (!String(form.table_number).trim()) {
      toast.error(t('tables.tableNumber') + ' ' + t('common.required'));
      return;
    }
    setSaving(true);
    try {
      const response = await window.api?.tables?.save({
        id: editingId || undefined,
        branch_id: currentBranch?.id || 1,
        table_number: form.table_number,
        seats_count: Number(form.seats_count) || 0,
        status: 'available',
      });
      if (response?.success) {
        toast.success(response.message);
        setModalOpen(false);
        loadTables();
      } else {
        toast.error(response?.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const cycleStatus = async (table) => {
    const nextStatus = STATUS_FLOW[table.status] || 'available';
    setBusyId(table.id);
    try {
      const response = await window.api?.tables?.updateStatus({ id: table.id, status: nextStatus });
      if (response?.success) {
        setTables((current) =>
          current.map((item) => (item.id === table.id ? { ...item, status: nextStatus } : item))
        );
        toast.success(`${t('tables.tableNumber')} ${table.table_number}: ${t(`tables.status${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`)}`);
      } else {
        toast.error(response?.error);
      }
    } finally {
      setBusyId(null);
    }
  };

  const openTableInvoice = async (table) => {
    setBusyId(table.id);
    try {
      const response = await window.api?.tables?.updateStatus({ id: table.id, status: 'occupied' });
      if (response?.success) {
        setTables((current) =>
          current.map((item) => (item.id === table.id ? { ...item, status: 'occupied' } : item))
        );
        toast.success(`${t('tables.tableNumber')} ${table.table_number}: ${t('tables.statusOccupied')}`);
        navigate('/pos', { state: { table: { id: table.id, number: table.table_number } } });
      } else {
        toast.error(response?.error);
      }
    } catch (err) {
      toast.error(err?.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleTableClick = (table) => {
    if (table.status === 'available') openTableInvoice(table);
    else cycleStatus(table);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await window.api?.tables?.delete({ id: deleteId });
      if (response?.success) {
        toast.success(response.message);
        setDeleteId(null);
        loadTables();
      } else {
        toast.error(response?.error);
      }
    } catch (err) {
      toast.error(err?.message);
    }
  };

  if (!isRestaurant) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('tables.title')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('tables.notAvailable')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('tables.title')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('tables.subtitle')}
          </p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          {t('tables.addTable')}
        </Button>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            {t('common.loading')}
          </div>
        ) : tables.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 24px' }}>
            <Armchair size={36} style={{ marginInlineEnd: 8 }} />
            <p style={{ marginTop: '10px', fontWeight: 600, color: 'var(--text-main)' }}>{t('tables.empty')}</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>{t('tables.emptyHint')}</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t('tables.clickHint')}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
              {tables.map((table) => {
                const color = STATUS_COLORS[table.status] || STATUS_COLORS.available;
                const statusLabel = t(`tables.status${table.status.charAt(0).toUpperCase() + table.status.slice(1)}`);
                const isBusy = busyId === table.id;
                return (
                  <div
                    key={table.id}
                    onClick={() => !isBusy && handleTableClick(table)}
                    style={{
                      position: 'relative',
                      borderRadius: '16px',
                      border: `2px solid ${color.base}`,
                      backgroundColor: color.soft,
                      padding: '18px',
                      cursor: isBusy ? 'wait' : 'pointer',
                      opacity: isBusy ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: `0 6px 16px ${color.glow}`,
                    }}
                  >
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(table);
                      }}
                      title={t('common.edit')}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        insetInlineEnd: '8px',
                        padding: '4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.7)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      <Armchair size={14} />
                    </button>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: color.base,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                      }}
                    >
                      <Armchair size={20} />
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {t('tables.tableNumber')} {table.table_number}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Users size={13} />
                      <span>{table.seats_count} {t('tables.seats')}</span>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '12px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#ffffff',
                        backgroundColor: color.base,
                      }}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                      {statusLabel}
                    </span>
                    {table.status === 'available' && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!isBusy) openTableInvoice(table);
                        }}
                        title={t('tables.openInvoice')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '12px',
                          insetInlineStart: '0',
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: color.base,
                          border: `1px solid ${color.base}`,
                          background: 'rgba(255, 255, 255, 0.85)',
                          cursor: isBusy ? 'wait' : 'pointer',
                        }}
                      >
                        <Receipt size={13} />
                        {t('tables.openInvoice')}
                      </button>
                    )}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteId(table.id);
                      }}
                      title={t('common.delete')}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        insetInlineEnd: '8px',
                        padding: '4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.7)',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('tables.editTable') : t('tables.addTable')}
        maxWidth="480px"
      >
        <form onSubmit={saveTable} style={{ display: 'grid', gap: '14px' }}>
          <Input
            label={t('tables.tableNumber')}
            required
            value={form.table_number}
            onChange={(event) => setForm({ ...form, table_number: event.target.value })}
            placeholder="1"
          />
          <Input
            label={t('tables.seatsCount')}
            type="number"
            min="0"
            value={form.seats_count}
            onChange={(event) => setForm({ ...form, seats_count: event.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" icon={Plus} loading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title={t('common.delete')}
        message={t('common.confirmDelete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default TablesPage;
