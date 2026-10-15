// ==============================================================================
// GYM VIP — Definición y Guardas de Rutas / Navegación
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../templates/AdminLayout';
import HomePage from '../pages/HomePage';
import ClientsPage from '../pages/ClientsPage';
import PlansPage from '../pages/PlansPage';
import StaffPage from '../pages/StaffPage';
import LoginModal from '../components/modals/LoginModal';

export function AppRoutes() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  if (!user) {
    return <LoginModal />;
  }

  return (
    <AdminLayout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'home' && <HomePage onNavigate={setCurrentView} />}
      {currentView === 'clients' && <ClientsPage />}
      {currentView === 'plans' && <PlansPage />}
      {currentView === 'staff' && <StaffPage />}
    </AdminLayout>
  );
}

export default AppRoutes;
