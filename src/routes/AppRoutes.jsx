// ==============================================================================
// GYM VIP — Definición y Guardas de Rutas / Navegación
// Control de autenticación, bloqueo por inactividad y autorización por rol
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../templates/AdminLayout';
import HomePage from '../pages/HomePage';
import ClientsPage from '../pages/ClientsPage';
import CoveragePage from '../pages/CoveragePage';
import VerificationPage from '../pages/VerificationPage';
import PlansPage from '../pages/PlansPage';
import StaffPage from '../pages/StaffPage';
import MembershipsPage from '../pages/MembershipsPage';
import SettingsPage from '../pages/SettingsPage';
import LoginModal from '../components/modals/LoginModal';
import LockScreenModal from '../components/modals/LockScreenModal';
import '../themes/jorge.css';
import '../themes/memberships.css';

export function AppRoutes() {
  const { user, isLocked, isAdmin, isRecepcion } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  // Si la sesión fue bloqueada por inactividad o expiración 401, ocultar toda la UI operativa
  if (isLocked) {
    return <LockScreenModal />;
  }

  // Si no hay sesión autenticada, presentar pantalla de acceso centrada
  if (!user) {
    return <LoginModal />;
  }

  return (
    <AdminLayout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'home' && <HomePage onNavigate={setCurrentView} />}
      {currentView === 'clients' && <ClientsPage />}
      {currentView === 'coverage' && (isAdmin() || isRecepcion()) && <CoveragePage onNavigate={setCurrentView} />}
      {currentView === 'verification' && (isAdmin() || isRecepcion()) && <VerificationPage onNavigate={setCurrentView} />}
      {currentView === 'plans' && <PlansPage />}
      {currentView === 'memberships' && (isAdmin() || isRecepcion()) && <MembershipsPage />}
      {currentView === 'staff' && <StaffPage />}
      {currentView === 'settings' && <SettingsPage />}
    </AdminLayout>
  );
}

export default AppRoutes;
