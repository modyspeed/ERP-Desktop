import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUserId = localStorage.getItem('app_user_id');
        if (savedUserId && window.api?.auth) {
          const res = await window.api.auth.getCurrentUser(Number(savedUserId));
          if (res && res.success && res.data) {
            setUser(res.data);
          } else {
            localStorage.removeItem('app_user_id');
          }
        }
      } catch (err) {
        console.error('Session restore error:', err);
        localStorage.removeItem('app_user_id');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    if (!window.api?.auth) {
      throw new Error('IPC Bridge is not available');
    }

    const res = await window.api.auth.login(credentials);
    if (!res.success) {
      throw new Error(res.error || 'فشل تسجيل الدخول');
    }

    setUser(res.data);
    localStorage.setItem('app_user_id', res.data.id);
    return res.data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('app_user_id');
  };

  const changePassword = async (params) => {
    if (!window.api?.auth) throw new Error('IPC Bridge is not available');
    const res = await window.api.auth.changePassword({ ...params, userId: user?.id });
    if (!res.success) throw new Error(res.error || 'فشل تغيير كلمة المرور');
    return res;
  };

  // Permission checker (Defense in depth & UI guards)
  const can = useCallback(
    (module, action) => {
      if (!user) return false;
      // Admin / Super Admin has all permissions
      if (user.role_id === 1 || user.roleName?.includes('Admin') || user.role_name?.includes('Admin')) {
        return true;
      }

      if (!user.permissions || !Array.isArray(user.permissions)) return false;

      return user.permissions.some(
        (p) => (p.module === module || p.module === '*') && (p.action === action || p.action === '*')
      );
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        changePassword,
        can,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
