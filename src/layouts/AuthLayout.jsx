import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { useSettings } from '../context/SettingsContext';
import { changeAppLanguage } from '../i18n';
import { Moon, Sun, Globe, ShieldCheck } from 'lucide-react';

const AuthLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { settings } = useSettings();

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    changeAppLanguage(nextLang);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-app)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient ambient background elements */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Floating Controls */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          insetInlineEnd: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10,
        }}
      >
        <button
          onClick={handleLanguageToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Globe size={16} />
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>

        <button
          onClick={toggleDarkMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
          title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
        >
          {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main Card Container */}
      <div
        className="glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 16px var(--primary-glow)',
              overflow: 'hidden',
            }}
          >
            {settings?.logo_path ? (
              <img
                src={settings.logo_path}
                alt="Company Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <ShieldCheck size={36} strokeWidth={2.2} />
            )}
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
            {settings?.company_name || t('common.appName')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {children}
      </div>

      {/* Footer info */}
      <div
        style={{
          marginTop: '28px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          zIndex: 5,
        }}
      >
        <p>© {new Date().getFullYear()} ERP Desktop System. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
};

export default AuthLayout;
