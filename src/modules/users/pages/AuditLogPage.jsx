import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import { Search, History, RefreshCw, Eye, Calendar, User } from 'lucide-react';

const AuditLogPage = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [query, setQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Diff Details Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchModules = async () => {
    try {
      if (window.api?.audit) {
        const res = await window.api.audit.getModules();
        if (res.success) setModules(res.data);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  };

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        if (window.api?.audit) {
          const res = await window.api.audit.search({
            query,
            module: selectedModule || undefined,
            action: selectedAction || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page,
            limit: pagination.limit,
          });

          if (res.success) {
            setLogs(res.data.items);
            setPagination({
              page: res.data.page,
              limit: res.data.limit,
              total: res.data.total,
              totalPages: res.data.totalPages,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    },
    [query, selectedModule, selectedAction, startDate, endDate, pagination.limit]
  );

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const getActionBadgeVariant = (action) => {
    switch (action) {
      case 'create':
      case 'seed':
        return 'success';
      case 'update':
      case 'change_password':
      case 'upload_logo':
        return 'primary';
      case 'delete':
        return 'danger';
      case 'login':
        return 'info';
      default:
        return 'default';
    }
  };

  const parseJSON = (str) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  const columns = [
    { header: '#', key: 'id', width: '60px' },
    {
      header: t('users.auditTime'),
      key: 'created_at',
      width: '180px',
      render: (dateStr) => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {new Date(dateStr).toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: t('users.auditUser'),
      key: 'user_name',
      render: (name, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={15} className="text-muted" />
          <span style={{ fontWeight: 600 }}>{name || row.username || 'النظام'}</span>
        </div>
      ),
    },
    {
      header: t('users.auditModule'),
      key: 'module',
      render: (mod) => <Badge variant="default">{mod}</Badge>,
    },
    {
      header: t('users.auditAction'),
      key: 'action',
      render: (act) => <Badge variant={getActionBadgeVariant(act)}>{act}</Badge>,
    },
    {
      header: 'عنوان IP',
      key: 'ip',
      render: (ip) => <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ip || '—'}</span>,
    },
    {
      header: t('common.actions'),
      key: 'actions',
      align: 'end',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Eye}
          onClick={() => setSelectedLog(row)}
        >
          {t('common.details')}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('users.auditTitle')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          سجل تتبع الحركات والتغييرات التي تمت على النظام بواسطة كافة المستخدمين
        </p>
      </div>

      {/* Filters Toolbar */}
      <Card noPadding>
        <div
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ flex: 1, minWidth: '220px' }}>
            <Input
              placeholder={t('common.search')}
              icon={Search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              placeholder="كل الأقسام"
              options={modules.map((m) => ({ value: m, label: m }))}
            />
          </div>

          <div style={{ width: '150px' }}>
            <Select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              placeholder="كل الإجراءات"
              options={[
                { value: 'login', label: 'تسجيل دخول (login)' },
                { value: 'create', label: 'إضافة (create)' },
                { value: 'update', label: 'تعديل (update)' },
                { value: 'delete', label: 'حذف (delete)' },
                { value: 'upload_logo', label: 'رفع شعار' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '140px' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>-</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '140px' }}
            />
          </div>

          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={() => fetchLogs(pagination.page)}
          >
            {t('common.refresh')}
          </Button>
        </div>

        {/* Table View */}
        <Table columns={columns} data={logs} loading={loading} />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={fetchLogs}
        />
      </Card>

      {/* Details / Diff Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="تفاصيل العملية المسجلة"
        maxWidth="620px"
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>المستخدم: </span>
                <strong>{selectedLog.user_name || selectedLog.username || 'النظام'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>الوقت: </span>
                <strong>{new Date(selectedLog.created_at).toLocaleString('ar-SA')}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>القسم: </span>
                <strong>{selectedLog.module}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>الإجراء: </span>
                <Badge variant={getActionBadgeVariant(selectedLog.action)}>{selectedLog.action}</Badge>
              </div>
            </div>

            {/* Old vs New Values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  القيمة السابقة (Old Value):
                </h4>
                <pre
                  style={{
                    backgroundColor: 'var(--border-subtle)',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {selectedLog.old_value
                    ? JSON.stringify(parseJSON(selectedLog.old_value), null, 2)
                    : '— (لا توجد بيانات سابقة)'}
                </pre>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  القيمة الجديدة (New Value):
                </h4>
                <pre
                  style={{
                    backgroundColor: 'var(--border-subtle)',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {selectedLog.new_value
                    ? JSON.stringify(parseJSON(selectedLog.new_value), null, 2)
                    : '— (لا توجد بيانات)'}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogPage;
