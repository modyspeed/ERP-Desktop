import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEME_COLORS, DEFAULT_THEME_COLOR } from './theme';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('app_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('app_theme_color') || DEFAULT_THEME_COLOR;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_dark_mode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', themeColor);
    localStorage.setItem('app_theme_color', themeColor);
  }, [themeColor]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        themeColor,
        setThemeColor,
        themeColors: THEME_COLORS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
