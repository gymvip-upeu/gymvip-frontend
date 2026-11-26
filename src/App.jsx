// ==============================================================================
// GYM VIP — Punto de Entrada de la Aplicación React
// ==============================================================================

import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import { SentryErrorBoundary } from './components/common/SentryErrorBoundary';
import AccountActivationPage from './pages/auth/AccountActivationPage';

export default function App() {
  if (['/activar-cuenta', '/restablecer-contrasena'].includes(window.location.pathname)) {
    return <AccountActivationPage recovery={window.location.pathname === '/restablecer-contrasena'} />;
  }
  return (
    <SentryErrorBoundary section="Sistema Central GYM VIP">
      <AuthProvider>
        <PreferencesProvider>
          <ThemeProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </ThemeProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SentryErrorBoundary>
  );
}