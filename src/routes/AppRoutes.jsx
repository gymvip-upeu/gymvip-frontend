// ==============================================================================
// GYM VIP — Definición y Guardas de Rutas / Navegación
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../templates/AdminLayout';
import HomePage from '../pages/HomePage';
import ClientsPage from '../pages/ClientsPage';
import CoveragePage from '../pages/CoveragePage';
import VerificationPage from '../pages/VerificationPage';
import '../themes/jorge.css';
import PlansPage from '../pages/PlansPage';
import StaffPage from '../pages/StaffPage';
import MembershipsPage from '../pages/MembershipsPage';
import '../themes/memberships.css';
import LoginModal from '../components/modals/LoginModal';

export function AppRoutes() {
  const { user, isAdmin, isRecepcion } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  if (!user) {
    return <LoginModal />;
  }

  return (
    <AdminLayout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'home' && <HomePage onNavigate={setCurrentView} />}
      {currentView === 'clients' && <ClientsPage />}
      {currentView === 'coverage' && (isAdmin() || isRecepcion()) && <CoveragePage />}
      {currentView === 'verification' && (isAdmin() || isRecepcion()) && <VerificationPage />}
      {currentView === 'plans' && <PlansPage />}
      {currentView === 'memberships' && (isAdmin() || isRecepcion()) && <MembershipsPage />}
      {currentView === 'staff' && <StaffPage />}
    </AdminLayout>
  );
}

export default AppRoutes;
