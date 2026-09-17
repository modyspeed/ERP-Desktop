import React from 'react';

const Tabs = ({ tabs = [], activeTab, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        backgroundColor: 'var(--border-subtle)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: isActive ? 700 : 500,
              borderRadius: '9px',
              border: 'none',
              backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
              color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
