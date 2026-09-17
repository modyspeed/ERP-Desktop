import React from 'react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './router/routes';
import './i18n';

function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <SettingsProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </SettingsProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
