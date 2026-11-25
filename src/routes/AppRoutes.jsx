// ==============================================================================
// GYM VIP — Definición y Guardas de Rutas / Navegación (HTML5 History API)
// Sincronización bidireccional con URL, botón Atrás/Adelante, recarga y permisos RBAC
// ==============================================================================

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../templates/AdminLayout';
import HomePage from '../pages/HomePage';
import LoginModal from '../components/modals/LoginModal';
import LockScreenModal from '../components/modals/LockScreenModal';
import { Alert } from '../components/common/Alert';
import { SentryErrorBoundary } from '../components/common/SentryErrorBoundary';
import { addSentryBreadcrumb } from '../config/sentry';
import '../themes/jorge.css';
import '../themes/memberships.css';
import '../themes/members.css';
import '../themes/plans.css';
import '../themes/catalog.css';

import { VIEW_PATH_MAP, resolveViewFromPath } from './routeConfig';

// Carga diferida (code splitting) de páginas secundarias para reducir el bundle inicial
const MemberAppPage = lazy(() => import('../pages/MemberAppPage'));
const ClientsPage = lazy(() => import('../pages/ClientsPage'));
const CoveragePage = lazy(() => import('../pages/CoveragePage'));
const VerificationPage = lazy(() => import('../pages/VerificationPage'));
const AttendanceAgendaPage = lazy(() => import('../pages/AttendanceAgendaPage'));
const PlansPage = lazy(() => import('../pages/PlansPage'));
const SupplementsPage = lazy(() => import('../pages/SupplementsPage'));
const SupplementOrdersPage = lazy(() => import('../pages/SupplementOrdersPage'));
const PromotionsPage = lazy(() => import('../pages/PromotionsPage'));
const MembershipsPage = lazy(() => import('../pages/MembershipsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ReminderConfigPage = lazy(() => import('../pages/ReminderConfigPage'));
const FaqPage = lazy(() => import('../pages/FaqPage'));
const FacilitiesPage = lazy(() => import('../pages/FacilitiesPage'));
const CommunicationsPage = lazy(() => import('../pages/CommunicationsPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const IncidentsPage = lazy(() => import('../pages/IncidentsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const DataImportPage = lazy(() => import('../pages/DataImportPage'));
const Error401Page = lazy(() => import('../pages/Error401Page'));
const Error403Page = lazy(() => import('../pages/Error403Page'));
const Error404Page = lazy(() => import('../pages/Error404Page'));
const Error500Page = lazy(() => import('../pages/Error500Page'));

export function AppRoutes() {
  const { user, isLocked, isAdmin, isGerente, isRecepcion } = useAuth();
  const isExecutive = isAdmin() || (isGerente && isGerente());
  const auditorOnly = user?.roles?.includes('AUDITOR') && !isExecutive && !isRecepcion();

  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      return resolveViewFromPath(window.location.pathname);
    }
    return 'home';
  });

  const [accessError, setAccessError] = useState(null);

  useEffect(() => {
    addSentryBreadcrumb('navigation', `Navegación a vista: ${currentView}`, { view: currentView });
  }, [currentView]);

  useEffect(() => {
    if (auditorOnly && !['reports', 'incidents', 'profile'].includes(currentView)) {
      setCurrentView('reports');
      window.history.replaceState({ view: 'reports' }, '', '/reportes');
    }
  }, [auditorOnly, currentView]);

  useEffect(() => {
    const deniedReminder = currentView === 'reminders' && !isExecutive;
    const deniedFaq = currentView === 'faq' && !isExecutive && !isRecepcion();
    if (user && (deniedReminder || deniedFaq)) {
      const msg = deniedReminder
        ? 'Acceso Denegado (403): La configuración de recordatorios está reservada para Gerentes y Administradores.'
        : 'Acceso Denegado (403): Respuestas frecuentes requiere rol Gerente, Administrador o Recepción.';
      setAccessError(msg);
      addSentryBreadcrumb('auth', 'Acceso denegado (403)', { view: currentView, reason: msg }, 'warning');
      setCurrentView('home');
      window.history.replaceState({ view: 'home' }, '', '/inicio');
    }
  }, [user, isExecutive, isRecepcion, currentView]);

  // Navegación programática con sincronización a la barra de direcciones del navegador
  const handleNavigate = useCallback((viewId) => {
    if (auditorOnly && !['reports', 'incidents', 'profile'].includes(viewId)) return;
    // Guarda de permisos para rutas administrativas
    if (viewId === 'staff' && !isExecutive) {
      setAccessError('Acceso Denegado (403): La gestión de personal está reservada para Gerentes y Administradores.');
      return;
    }
    if (viewId === 'dataImport' && !isAdmin()) {
      setAccessError('Acceso Denegado (403): La importación masiva y ETL está reservada exclusivamente para el Administrador de Sistemas TI.');
      return;
    }
    if (viewId === 'reminders' && !isExecutive) {
      setAccessError('Acceso Denegado (403): La configuración de recordatorios está reservada para Gerentes y Administradores.');
      return;
    }
    if (['settings', 'communications', 'faq'].includes(viewId) && !isExecutive && !isRecepcion()) {
      setAccessError('Acceso Denegado (403): La sección solicitada requiere rol Gerente, Administrador o Recepción.');
      return;
    }
    if (['reports', 'incidents'].includes(viewId) && !isExecutive && !auditorOnly) {
      setAccessError('Acceso Denegado (403): Reportes e incidencias requieren rol Gerente, Administrador o Auditor.');
      return;
    }

    setAccessError(null);
    const targetPath = VIEW_PATH_MAP[viewId] || '/inicio';

    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ view: viewId }, '', targetPath);
    }
    setCurrentView(viewId);
  }, [isExecutive, isAdmin, isRecepcion, auditorOnly]);

  // Manejo de eventos popstate (botones Atrás / Adelante del navegador)
  useEffect(() => {
    const handlePopState = () => {
      const path = (window.location.pathname || '').toLowerCase();

      // Guarda de permisos para sub-ruta de importación masiva (HU-06)
      if (path.includes('/importar') && !isAdmin()) {
        setAccessError('Acceso Denegado (403): La importación masiva de miembros está reservada exclusivamente para Administradores de Sistemas TI.');
        setCurrentView('clients');
        window.history.replaceState({ view: 'clients' }, '', '/miembros');
        return;
      }

      const nextView = resolveViewFromPath(window.location.pathname);

      if ((nextView === 'staff' || nextView === 'reminders') && !isExecutive) {
        setAccessError('Acceso Denegado (403): Requiere privilegios de Gerente o Administrador.');
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '/inicio');
        return;
      }
      if (nextView === 'dataImport' && !isAdmin()) {
        setAccessError('Acceso Denegado (403): La importación masiva está reservada para Administradores de Sistemas TI.');
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '/inicio');
        return;
      }
      if (['communications', 'faq', 'settings'].includes(nextView) && !isExecutive && !isRecepcion()) {
        setAccessError('Acceso Denegado (403): La sección requiere rol Gerente, Administrador o Recepción.');
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '/inicio');
        return;
      }

      setAccessError(null);
      setCurrentView(nextView);
    };

    // Validación en carga directa inicial para /miembros/importar
    const initialPath = (window.location.pathname || '').toLowerCase();
    if (initialPath.includes('/importar') && !isAdmin()) {
      setAccessError('Acceso Denegado (403): La importación masiva de miembros está reservada exclusivamente para Administradores de Sistemas TI.');
      window.history.replaceState({ view: 'clients' }, '', '/miembros');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isExecutive, isAdmin, isRecepcion]);

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
    return (
      <SentryErrorBoundary section="Portal del Socio Móvil">
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#D4AF37' }}>Cargando portal...</div>}>
          <MemberAppPage />
        </Suspense>
      </SentryErrorBoundary>
    );
  }

  if (auditorOnly) {
    return (
      <AdminLayout currentView={currentView} onNavigate={handleNavigate}>
        <SentryErrorBoundary section="Auditoría">
          <Suspense fallback={<p>Cargando auditoría…</p>}>
            {currentView === 'profile' ? <ProfilePage /> : currentView === 'incidents' ? <IncidentsPage /> : <ReportsPage />}
          </Suspense>
        </SentryErrorBoundary>
      </AdminLayout>
    );
  }

  return (
    <>
      <AdminLayout currentView={currentView} onNavigate={handleNavigate}>
        <SentryErrorBoundary section={`Vista ${currentView}`}>
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#D4AF37' }}>Cargando sección...</div>}>
            {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
            {currentView === 'clients' && <ClientsPage />}
            {currentView === 'coverage' && (isExecutive || isRecepcion()) && <CoveragePage onNavigate={handleNavigate} />}
            {currentView === 'verification' && (isExecutive || isRecepcion()) && <VerificationPage onNavigate={handleNavigate} />}
            {currentView === 'attendance' && (isExecutive || isRecepcion()) && <AttendanceAgendaPage onNavigate={handleNavigate} />}
            {currentView === 'plans' && <PlansPage />}
            {currentView === 'supplements' && <SupplementsPage />}
            {currentView === 'supplementOrders' && (isExecutive || isRecepcion()) && <SupplementOrdersPage />}
            {currentView === 'promotions' && <PromotionsPage />}
            {currentView === 'memberships' && (isExecutive || isRecepcion()) && <MembershipsPage onNavigate={handleNavigate} />}
            {currentView === 'reminders' && (isExecutive ? <ReminderConfigPage /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'faq' && (isExecutive || isRecepcion() ? <FaqPage /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN', 'RECEPCION']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'facilities' && (isExecutive || isRecepcion() ? <FacilitiesPage /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN', 'RECEPCION']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'communications' && (isExecutive || isRecepcion() ? <CommunicationsPage /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN', 'RECEPCION']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'staff' && (isExecutive ? <SettingsPage initialTab="staff" onNavigate={handleNavigate} /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'settings' && ((isExecutive || isRecepcion()) ? <SettingsPage initialTab="rules" onNavigate={handleNavigate} /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN', 'RECEPCION']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'profile' && <ProfilePage />}
            {currentView === 'reports' && (isExecutive || auditorOnly ? <ReportsPage /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN', 'AUDITOR']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'incidents' && (isExecutive || auditorOnly ? <IncidentsPage /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN', 'AUDITOR']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'dataImport' && (isAdmin() ? <DataImportPage onNavigate={handleNavigate} /> : <Error403Page userRole={user?.roles?.[0]} requiredRoles={['ADMIN (Soporte TI)']} onGoHome={() => handleNavigate('home')} />)}
            {currentView === 'notFound' && <Error404Page requestedPath={typeof window !== 'undefined' ? window.location.pathname : ''} onNavigate={handleNavigate} />}
            {currentView === 'forbidden' && <Error403Page userRole={user?.roles?.[0]} requiredRoles={['GERENTE', 'ADMIN']} onGoHome={() => handleNavigate('home')} />}
            {currentView === 'unauthorized' && <Error401Page onLoginClick={() => window.location.reload()} onGoHome={() => handleNavigate('home')} />}
            {currentView === 'serverError' && <Error500Page onRetry={() => window.location.reload()} onGoHome={() => handleNavigate('home')} />}
          </Suspense>
        </SentryErrorBoundary>
      </AdminLayout>

      {/* Aviso accesible superior derecho de Error 403 / Denegación de permisos (INC-S1-07) */}
      {accessError && (
        <Alert
          variant="forbidden"
          floating
          autoClose
          title="Acceso No Autorizado (403)"
          message={accessError}
          onClose={() => setAccessError(null)}
        />
      )}
    </>
  );
}

export default AppRoutes;
