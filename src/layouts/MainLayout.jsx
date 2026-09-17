import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { useSettings } from '../context/SettingsContext';
import { changeAppLanguage } from '../i18n';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  ShoppingBag,
  Landmark,
  Users as UsersIcon,
  BarChart3,
  UserCheck,
  History,
  Settings,
  Menu,
  Moon,
  Sun,
  Globe,
  LogOut,
  Building2,
  Bell,
  Search,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

const MainLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, can } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { settings, branches, currentBranch, setCurrentBranchId } = useSettings();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    changeAppLanguage(nextLang);
  };

  const navItems = [
    { key: 'dashboard', to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), module: 'dashboard' },
    { key: 'sales', to: '/sales', icon: ShoppingCart, label: t('nav.sales'), module: 'sales' },
    { key: 'pos', to: '/pos', icon: Receipt, label: t('nav.pos'), module: 'pos' },
    { key: 'inventory', to: '/inventory', icon: Package, label: t('nav.inventory'), module: 'inventory' },
    { key: 'purchases', to: '/purchases', icon: ShoppingBag, label: t('nav.purchases'), module: 'purchases', badge: 'قريباً' },
    { key: 'accounting', to: '/accounting', icon: Landmark, label: t('nav.accounting'), module: 'accounting', badge: 'قريباً' },
    { key: 'hr', to: '/hr', icon: UsersIcon, label: t('nav.hr'), module: 'hr', badge: 'قريباً' },
    { key: 'reports', to: '/reports', icon: BarChart3, label: t('nav.reports'), module: 'reports', badge: 'قريباً' },
    { key: 'users', to: '/users', icon: UserCheck, label: t('nav.users'), module: 'users' },
    { key: 'roles', to: '/roles', icon: ShieldCheck, label: t('nav.roles'), module: 'roles' },
    { key: 'audit', to: '/audit-logs', icon: History, label: t('nav.auditLogs'), module: 'audit_logs' },
    { key: 'settings', to: '/settings', icon: Settings, label: t('nav.settings'), module: 'settings' },
  ];

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarCollapsed ? '80px' : '260px',
          backgroundColor: 'var(--bg-sidebar)',
          borderInlineEnd: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        {/* Sidebar Header / Logo */}
        <div
          style={{
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            padding: sidebarCollapsed ? '0 16px' : '0 20px',
            gap: '12px',
            borderBottom: '1px solid var(--border-color)',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {settings?.logo_path ? (
              <img
                src={settings.logo_path}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <ShieldCheck size={24} />
            )}
          </div>

          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {settings?.company_name || t('common.appName')}
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>نظام إدارة الموارد ERP</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.key}
                to={item.to}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarCollapsed ? '12px 0' : '10px 14px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 4px 12px var(--primary-light)' : 'none',
                }}
                className={!isActive ? 'hover:bg-slate-100 dark:hover:bg-slate-800/60' : ''}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}
                {!sidebarCollapsed && item.badge && !isActive && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: '14px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              background: 'transparent',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '8px',
            }}
            title={t('nav.logout')}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Header Bar */}
        <header
          className="glass-header"
          style={{
            height: '70px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          {/* Left Actions: Sidebar toggle & Global Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Menu size={18} />
            </button>

            {/* Branch Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setBranchMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Building2 size={16} className="text-primary" />
                <span>{currentBranch?.name || 'الفرع الرئيسي'}</span>
                <ChevronDown size={14} />
              </button>

              {branchMenuOpen && (
                <div
                  className="glass animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    insetInlineStart: 0,
                    minWidth: '200px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '6px',
                    zIndex: 100,
                  }}
                >
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setCurrentBranchId(b.id);
                        setBranchMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: currentBranch?.id === b.id ? 'var(--primary-light)' : 'transparent',
                        color: currentBranch?.id === b.id ? 'var(--primary-color)' : 'var(--text-main)',
                        fontSize: '13px',
                        fontWeight: currentBranch?.id === b.id ? 700 : 500,
                        textAlign: 'start',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{b.name}</span>
                      {b.is_main_branch && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>رئيسي</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language Switch */}
            <button
              onClick={handleLanguageToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Globe size={16} />
              <span>{i18n.language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleDarkMode}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {/* User Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-color)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  {user?.fullName ? user.fullName.charAt(0) : 'U'}
                </div>
                <div style={{ textAlign: 'start' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>
                    {user?.fullName || user?.username || 'المستخدم'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                    {user?.roleName || user?.role_name || 'مدير'}
                  </div>
                </div>
                <ChevronDown size={14} />
              </button>

              {userMenuOpen && (
                <div
                  className="glass animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    insetInlineEnd: 0,
                    minWidth: '220px',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-xl)',
                    padding: '8px',
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {user?.fullName}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email || user?.username}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'start',
                      marginTop: '4px',
                    }}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings size={16} />
                    <span>{t('nav.settings')}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'start',
                      marginTop: '2px',
                    }}
                    className="hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut size={16} />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
