import React from 'react';
import Card from './Card';
import Badge from './Badge';
import { Sparkles } from 'lucide-react';

const PlaceholderModule = ({ title, phase, description, features = [] }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {title}
          </h1>
          <Badge variant="primary">{phase}</Badge>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {description}
        </p>
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '48px 24px',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px var(--primary-glow)',
            }}
          >
            <Sparkles size={32} />
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              هذه الوحدة مبرمجة في خارطة الطريق القادمة ({phase})
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '500px', lineHeight: 1.6 }}>
              تم تجهيز جداول قاعدة البيانات الخاصة بها في المرحلة الحالية، وستتم برمجة واجهاتها ومنطق الأعمال في المرحلة المحددة.
            </p>
          </div>

          {features.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px',
                maxWidth: '600px',
              }}
            >
              {features.map((feat, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--border-subtle)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PlaceholderModule;
