import React from 'react';
import { Inbox } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'لا توجد بيانات لعرضها',
  onRowClick,
}) => {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 0',
          color: 'var(--text-muted)',
        }}
      >
        <LoadingSpinner text="جاري تحميل البيانات..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
          color: 'var(--text-muted)',
          gap: '12px',
        }}
      >
        <Inbox size={48} strokeWidth={1.2} />
        <p style={{ fontSize: '14px', fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'start',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--border-subtle)',
            }}
          >
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{
                  padding: '12px 16px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textAlign: col.align || 'start',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: '1px solid var(--border-color)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
              }}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  style={{
                    padding: '14px 16px',
                    color: 'var(--text-main)',
                    textAlign: col.align || 'start',
                    verticalAlign: 'middle',
                  }}
                >
                  {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
