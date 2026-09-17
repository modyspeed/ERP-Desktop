import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'danger', 'ghost', 'outline'
  size = 'md', // 'sm', 'md', 'lg'
  icon: Icon,
  iconPosition = 'start',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '13px', borderRadius: '8px' },
    md: { padding: '9px 16px', fontSize: '14px', borderRadius: '10px' },
    lg: { padding: '12px 24px', fontSize: '15px', borderRadius: '12px' },
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary-color)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 2px 8px var(--primary-light)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--border-subtle)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-color)',
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-main)',
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--primary-color)',
          border: '1px solid var(--primary-color)',
        };
      default:
        return {};
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
      } ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        <>
          {Icon && iconPosition === 'start' && <Icon size={size === 'sm' ? 16 : 18} />}
          {children}
          {Icon && iconPosition === 'end' && <Icon size={size === 'sm' ? 16 : 18} />}
        </>
      )}
    </button>
  );
};

export default Button;
