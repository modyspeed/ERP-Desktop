import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { changeAppLanguage } from '../i18n';
import { useTheme } from '../theme/ThemeProvider';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [branches, setBranches] = useState([]);
  const [currentBranchId, setCurrentBranchId] = useState(1);
  const [loading, setLoading] = useState(true);
  const { setThemeColor, setIsDarkMode } = useTheme();

  const fetchSettings = useCallback(async () => {
    try {
      if (window.api?.settings) {
        const res = await window.api.settings.get();
        if (res && res.success && res.data) {
          setSettings(res.data);
          // Apply initial theme settings from DB if configured
          if (res.data.theme_color) {
            setThemeColor(res.data.theme_color);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, [setThemeColor]);

  const fetchBranches = useCallback(async () => {
    try {
      if (window.api?.branches) {
        const res = await window.api.branches.list();
        if (res && res.success && res.data) {
          setBranches(res.data);
          const main = res.data.find((b) => b.is_main_branch);
          if (main) setCurrentBranchId(main.id);
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchBranches()]);
      setLoading(false);
    };
    init();
  }, [fetchSettings, fetchBranches]);

  const updateSettings = async (data, currentUserId) => {
    if (!window.api?.settings) throw new Error('IPC Bridge is not available');
    const res = await window.api.settings.update({ data, currentUserId });
    if (!res.success) throw new Error(res.error || 'فشل حفظ الإعدادات');
    setSettings(res.data);
    if (data.theme_color) setThemeColor(data.theme_color);
    if (data.default_language) changeAppLanguage(data.default_language);
    return res.data;
  };

  const uploadLogo = async (file, currentUserId) => {
    if (!window.api?.settings) throw new Error('IPC Bridge is not available');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Array.from(new Uint8Array(arrayBuffer));
    const res = await window.api.settings.uploadLogo({
      fileBuffer: buffer,
      fileName: file.name,
      currentUserId,
    });
    if (!res.success) throw new Error(res.error || 'فشل رفع الشعار');
    setSettings(res.data);
    return res.data;
  };

  const currentBranch = branches.find((b) => b.id === currentBranchId) || branches[0] || { id: 1, name: 'الفرع الرئيسي' };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        branches,
        currentBranch,
        currentBranchId,
        setCurrentBranchId,
        loading,
        refreshSettings: fetchSettings,
        refreshBranches: fetchBranches,
        updateSettings,
        uploadLogo,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
