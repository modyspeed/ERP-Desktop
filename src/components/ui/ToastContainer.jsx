import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />,
    error: <XCircle size={20} className="text-rose-500 flex-shrink-0" />,
    info: <Info size={20} className="text-blue-500 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-200',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {icons[toast.type] || icons.info}
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{toast.message}</span>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
