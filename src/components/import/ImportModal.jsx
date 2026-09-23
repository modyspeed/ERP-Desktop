import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const FIELD_LABELS = {
  name: 'الاسم',
  barcode: 'الباركود',
  category: 'التصنيف',
  unit: 'الوحدة',
  cost_price: 'سعر التكلفة',
  sale_price: 'سعر البيع',
  min_stock_alert: 'حد التنبيه',
  phone: 'الهاتف',
  email: 'البريد الإلكتروني',
  address: 'العنوان',
  opening_balance: 'الرصيد الافتتاحي',
};

const ImportModal = ({ open, type, branchId, onClose, onImported }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [data, setData] = useState(null);
  const [excluded, setExcluded] = useState(new Set());

  const startImport = useCallback(async () => {
    setLoading(true);
    setData(null);
    setExcluded(new Set());
    const response = await window.api?.importData?.selectFile({ type, branch_id: branchId || 1 });
    if (!response) {
      setLoading(false);
      onClose();
      return;
    }
    if (response.canceled) {
      setLoading(false);
      onClose();
      return;
    }
    if (!response.success) {
      toast.error(response.error || 'تعذر قراءة الملف');
      setLoading(false);
      onClose();
      return;
    }
    // استبعد الصفوف الخاطئة افتراضياً
    setExcluded(new Set(response.data.rows.filter((row) => row._errors?.length).map((row) => row._rowNumber)));
    setData(response.data);
    setLoading(false);
  }, [type, branchId, toast, onClose]);

  useEffect(() => {
    if (open) startImport();
  }, [open, startImport]);

  const toggleRow = (rowNumber, hasErrors) => {
    if (hasErrors) return;
    setExcluded((current) => {
      const next = new Set(current);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const toggleAll = () => {
    if (!data) return;
    const selectable = data.rows.filter((row) => !row._errors?.length);
    const allExcluded = selectable.length > 0 && selectable.every((row) => excluded.has(row._rowNumber));
    setExcluded(new Set(allExcluded ? [] : selectable.map((row) => row._rowNumber)));
  };

  const confirmImport = async () => {
    if (!data) return;
    const selected = data.rows.filter((row) => !excluded.has(row._rowNumber) && !row._errors?.length);
    if (!selected.length) {
      toast.error('لا توجد صفوف صالحة محددة للاستيراد');
      return;
    }
    setApplying(true);
    const payload = selected.map(({ _rowNumber, _errors, ...fields }) => ({ ...fields, _rowNumber }));
    const response = await window.api?.importData?.apply({ type, rows: payload, branch_id: branchId || 1 });
    setApplying(false);
    if (response?.success) {
      toast.success(response.message);
      onImported?.();
      onClose();
    } else {
      toast.error(response?.error || 'فشل الاستيراد');
    }
  };

  const rows = data?.rows || [];
  const fields = data?.fields || [];
  const errorCount = rows.filter((row) => row._errors?.length).length;
  const selectedCount = rows.filter((row) => !excluded.has(row._rowNumber) && !row._errors?.length).length;
  const selectableRows = rows.filter((row) => !row._errors?.length);
  const allSelected = selectableRows.length > 0 && selectableRows.every((row) => !excluded.has(row._rowNumber));

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="استيراد البيانات"
      subtitle={data ? `${data.fileName} — ${rows.length} صف` : 'اختر ملف Excel أو CSV'}
      maxWidth="960px"
      footer={
        data ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={applying}>
              إلغاء
            </Button>
            <Button icon={Upload} loading={applying} onClick={confirmImport} disabled={!selectedCount}>
              استيراد {selectedCount} صف
            </Button>
          </>
        ) : null
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <FileSpreadsheet size={40} style={{ margin: '0 auto 12px' }} />
          <p>جاري قراءة الملف وتحليل الصفوف...</p>
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 9999,
                border: '1px solid var(--border-color)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-main)',
                backgroundColor: 'var(--border-subtle)',
              }}
            >
              <CheckCircle2 size={14} color="#10b981" />
              {selectedCount} صالح للاستيراد
            </span>
            {errorCount > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 9999,
                  border: '1px solid #fca5a5',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#b91c1c',
                  backgroundColor: '#fef2f2',
                }}
              >
                <AlertTriangle size={14} />
                {errorCount} صف به أخطاء (مستبعد)
              </span>
            )}
            <button
              type="button"
              onClick={toggleAll}
              disabled={!selectableRows.length}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 9999,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: selectableRows.length ? 'pointer' : 'not-allowed',
              }}
            >
              <input type="checkbox" checked={allSelected} readOnly disabled={!selectableRows.length} />
              تحديد الكل
            </button>
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'auto', maxHeight: '52vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'start' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--border-subtle)' }}>
                  <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>#</th>
                  {fields.map((field) => (
                    <th
                      key={field}
                      style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
                    >
                      {FIELD_LABELS[field] || field}
                    </th>
                  ))}
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const hasErrors = Boolean(row._errors?.length);
                  const isExcluded = excluded.has(row._rowNumber);
                  return (
                    <tr
                      key={row._rowNumber}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: hasErrors ? '#fef2f2' : isExcluded ? 'var(--border-subtle)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        {row._rowNumber}
                      </td>
                      {fields.map((field) => (
                        <td
                          key={field}
                          style={{
                            padding: '10px 12px',
                            color: hasErrors ? '#7f1d1d' : 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            textDecoration: isExcluded ? 'line-through' : 'none',
                            opacity: isExcluded ? 0.6 : 1,
                          }}
                        >
                          {String(row[field] ?? '')}
                        </td>
                      ))}
                      <td style={{ padding: '10px 12px', minWidth: 220 }}>
                        {hasErrors ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {row._errors.map((error, index) => (
                              <span
                                key={index}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#b91c1c', fontSize: 12, fontWeight: 600 }}
                              >
                                <XCircle size={13} style={{ flexShrink: 0 }} />
                                {error}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={!isExcluded}
                              onChange={() => toggleRow(row._rowNumber, false)}
                            />
                            جاهز للاستيراد
                          </label>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            الصفوف الحمراء تحتوي على أخطاء تمنع استيرادها، والصفوف المشطوبة تم استبعادها يدويًا. سيتم حفظ الصفوف المحددة فقط في
            قاعدة البيانات دفعة واحدة.
          </p>
        </div>
      ) : null}
    </Modal>
  );
};

export default ImportModal;
