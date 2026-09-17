import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}
    >
      <div>
        <span>
          عرض صفحة <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> من{' '}
          <strong style={{ color: 'var(--text-main)' }}>{totalPages}</strong> (إجمالي {totalItems}{' '}
          عنصر)
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            opacity: currentPage <= 1 ? 0.4 : 1,
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((p, idx, arr) => {
            const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
            return (
              <React.Fragment key={p}>
                {showEllipsis && <span style={{ padding: '0 4px' }}>...</span>}
                <button
                  onClick={() => onPageChange(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: '8px',
                    border: p === currentPage ? 'none' : '1px solid var(--border-color)',
                    background: p === currentPage ? 'var(--primary-color)' : 'var(--bg-surface)',
                    color: p === currentPage ? '#ffffff' : 'var(--text-main)',
                    fontWeight: p === currentPage ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
};

export default Pagination;
