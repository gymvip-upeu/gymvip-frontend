// ==============================================================================
// GYM VIP — Punto de Entrada de la Aplicación React
// ==============================================================================

import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import { SentryErrorBoundary } from './components/common/SentryErrorBoundary';
import AccountActivationPage from './pages/auth/AccountActivationPage';
import gymVipMuiTheme from './shared/theme/gymVipMuiTheme';

export default function App() {
  if (['/activar-cuenta', '/restablecer-contrasena'].includes(window.location.pathname)) {
    return (
      <MuiThemeProvider theme={gymVipMuiTheme}>
        <AccountActivationPage recovery={window.location.pathname === '/restablecer-contrasena'} />
      </MuiThemeProvider>
    );
  }
  return (
    <SentryErrorBoundary section="Sistema Central GYM VIP">
      <MuiThemeProvider theme={gymVipMuiTheme}>
        <CssBaseline />
        <AuthProvider>
          <PreferencesProvider>
            <ThemeProvider>
              <NotificationProvider>
                <AppRoutes />
              </NotificationProvider>
            </ThemeProvider>
          </PreferencesProvider>
        </AuthProvider>
      </MuiThemeProvider>
    </SentryErrorBoundary>
  );
}