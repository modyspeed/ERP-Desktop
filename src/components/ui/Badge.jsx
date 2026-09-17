import React from 'react';

const Badge = ({
  children,
  variant = 'default', // 'default', 'success', 'warning', 'danger', 'info', 'primary'
  size = 'md',
  dot = false,
  className = '',
  style = {},
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.25)',
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.25)',
        };
      case 'info':
        return {
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          color: '#06b6d4',
          border: '1px solid rgba(6, 182, 212, 0.25)',
        };
      case 'primary':
        return {
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary-color)',
          border: '1px solid var(--primary-light)',
        };
      default:
        return {
          backgroundColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
        };
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        borderRadius: '9999px',
        lineHeight: 1.2,
        ...getStyles(),
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
