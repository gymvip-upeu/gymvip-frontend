// ==============================================================================
// GYM VIP — Punto de Entrada de la Aplicación React
// ==============================================================================

import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import { SentryErrorBoundary } from './components/common/SentryErrorBoundary';

export default function App() {
  return (
    <SentryErrorBoundary section="Sistema Central GYM VIP">
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </SentryErrorBoundary>
  );
}