import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      style = {},
      required = false,
      ...props
    },
    ref
  ) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {label}
            {required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {Icon && (
            <div
              style={{
                position: 'absolute',
                insetInlineStart: '12px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Icon size={18} />
            </div>
          )}

          <input
            ref={ref}
            type={type}
            style={{
              width: '100%',
              padding: Icon ? '10px 14px 10px 38px' : '10px 14px',
              paddingInlineStart: Icon ? '38px' : '14px',
              paddingInlineEnd: '14px',
              fontSize: '14px',
              color: 'var(--text-main)',
              backgroundColor: 'var(--bg-surface)',
              border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`,
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
              ...style,
            }}
            className={className}
            {...props}
          />
        </div>

        {error && <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>{error}</span>}
        {helperText && !error && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
