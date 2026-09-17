import React, { forwardRef } from 'react';

const Select = forwardRef(
  (
    {
      label,
      error,
      options = [],
      placeholder,
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

        <select
          ref={ref}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            color: 'var(--text-main)',
            backgroundColor: 'var(--bg-surface)',
            border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`,
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            ...style,
          }}
          className={className}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
