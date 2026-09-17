import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  style = {},
  noPadding = false,
  glass = true,
  ...props
}) => {
  return (
    <div
      className={`${glass ? 'glass' : ''} ${className}`}
      style={{
        borderRadius: '16px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        ...style,
      }}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            {title && (
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: noPadding ? '0' : '24px' }}>{children}</div>
    </div>
  );
};

export default Card;
