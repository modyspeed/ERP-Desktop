import React from 'react';

const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // { value: '+12%', isPositive: true }
  color = 'primary', // 'primary', 'emerald', 'amber', 'rose', 'indigo'
  onClick,
}) => {
  const colorMap = {
    primary: {
      bg: 'var(--primary-light)',
      text: 'var(--primary-color)',
      glow: 'var(--primary-glow)',
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      text: '#10b981',
      glow: 'rgba(16, 185, 129, 0.25)',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.25)',
    },
    rose: {
      bg: 'rgba(239, 68, 68, 0.12)',
      text: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.25)',
    },
    indigo: {
      bg: 'rgba(99, 102, 241, 0.12)',
      text: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.25)',
    },
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div
      onClick={onClick}
      className="glass"
      style={{
        borderRadius: '16px',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--shadow-md)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: selectedColor.bg,
              color: selectedColor.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
          {value}
        </span>
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          {trend && (
            <span
              style={{
                fontWeight: 700,
                color: trend.isPositive ? '#10b981' : '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
