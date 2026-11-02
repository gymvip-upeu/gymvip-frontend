// ==============================================================================
// GYM VIP — Definición y Guardas de Rutas / Navegación (HTML5 History API)
// Sincronización bidireccional con URL, botón Atrás/Adelante, recarga y permisos RBAC
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../templates/AdminLayout';
import HomePage from '../pages/HomePage';
import MemberAppPage from '../pages/MemberAppPage';
import ClientsPage from '../pages/ClientsPage';
import CoveragePage from '../pages/CoveragePage';
import VerificationPage from '../pages/VerificationPage';
import PlansPage from '../pages/PlansPage';
import StaffPage from '../pages/StaffPage';
import MembershipsPage from '../pages/MembershipsPage';
import SettingsPage from '../pages/SettingsPage';
import LoginModal from '../components/modals/LoginModal';
import LockScreenModal from '../components/modals/LockScreenModal';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import '../themes/jorge.css';
import '../themes/memberships.css';
import '../themes/members.css';
import '../themes/plans.css';

import { PATH_VIEW_MAP, VIEW_PATH_MAP, resolveViewFromPath } from './routeConfig';

export function AppRoutes() {
  const { user, isLocked, isAdmin, isRecepcion } = useAuth();

  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      return resolveViewFromPath(window.location.pathname);
    }
    return 'home';
  });

  const [accessError, setAccessError] = useState(null);

  // Navegación programática con sincronización a la barra de direcciones del navegador
  const handleNavigate = useCallback((viewId) => {
    // Guarda de permisos para rutas administrativas
    if ((viewId === 'staff' || viewId === 'settings') && !isAdmin()) {
      setAccessError('Acceso Denegado (403): La sección solicitada está reservada exclusivamente para Administradores.');
      return;
    }

    setAccessError(null);
    const targetPath = VIEW_PATH_MAP[viewId] || '/inicio';

    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ view: viewId }, '', targetPath);
    }
    setCurrentView(viewId);
  }, [isAdmin]);

  // Manejo de eventos popstate (botones Atrás / Adelante del navegador)
  useEffect(() => {
    const handlePopState = () => {
      const nextView = resolveViewFromPath(window.location.pathname);

      if ((nextView === 'staff' || nextView === 'settings') && !isAdmin()) {
        setAccessError('Acceso Denegado (403): No dispone de privilegios de Administrador para ver esta página.');
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '/inicio');
        return;
      }

      setAccessError(null);
      setCurrentView(nextView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdmin]);

  // Normalización de URL raíz a /inicio en primera carga
  useEffect(() => {
    if (user && !user.roles?.includes('CLIENTE')) {
      const clean = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      if (clean === '/' || clean === '/home') {
        window.history.replaceState({ view: 'home' }, '', '/inicio');
      }
    }
  }, [user]);

  // Si la sesión fue bloqueada por inactividad o expiración 401, ocultar toda la UI operativa
  if (isLocked) {
    return <LockScreenModal />;
  }

  // Si no hay sesión autenticada, presentar pantalla de acceso centrada
  if (!user) {
    return <LoginModal />;
  }

  // Rutas de auto-servicio móvil para clientes
  if (user.roles?.includes('CLIENTE')) {
    return <MemberAppPage />;
  }

  return (
    <>
      <AdminLayout currentView={currentView} onNavigate={handleNavigate}>
        {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentView === 'clients' && <ClientsPage />}
        {currentView === 'coverage' && (isAdmin() || isRecepcion()) && <CoveragePage onNavigate={handleNavigate} />}
        {currentView === 'verification' && (isAdmin() || isRecepcion()) && <VerificationPage onNavigate={handleNavigate} />}
        {currentView === 'plans' && <PlansPage />}
        {currentView === 'memberships' && (isAdmin() || isRecepcion()) && <MembershipsPage />}
        {currentView === 'staff' && (isAdmin() ? <StaffPage /> : null)}
        {currentView === 'settings' && (isAdmin() ? <SettingsPage /> : null)}
      </AdminLayout>

      {/* Modal accesible de Error 403 / Restricción de permisos */}
      {accessError && (
        <FeedbackModal
          isOpen={true}
          variant="forbidden"
          title="Acceso No Autorizado"
          message={accessError}
          onClose={() => setAccessError(null)}
          actionText="Entendido"
        />
      )}
    </>
  );
}

export default AppRoutes;
