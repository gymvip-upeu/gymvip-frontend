// ==============================================================================
// GYM VIP — Plantilla: AdminLayout (Shell Principal)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AdminLayout({ currentView, onNavigate, children }) {
  const { user, logout, isAdmin, isRecepcion } = useAuth();
  const auditorOnly = user?.roles?.includes('AUDITOR') && !isAdmin() && !isRecepcion();

  // Preferencia de plegado persistida en localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('gymvip_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Estado drawer en móviles
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('gymvip_sidebar_collapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  // Cierre de drawer móvil al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  const navItems = auditorOnly ? [
    { id: 'reports', label: 'Reportes', iconName: 'calendar', title: 'Reportes y métricas' },
    { id: 'incidents', label: 'Incidencias', iconName: 'alert-triangle', title: 'Gestión de incidencias' },
  ] : [
    { id: 'home', label: 'Inicio', iconName: 'home', title: 'Panel de Control Principal' },
    { id: 'clients', label: 'Miembros', iconName: 'users', title: 'Directorio y Gestión de Miembros' },
    ...(isAdmin() || isRecepcion() ? [
      { id: 'operations', label: 'Operaciones', iconName: 'credit-card', title: 'Operaciones: Cobros, Vigencias y Acceso' },
    ] : []),
    { id: 'plans', label: 'Planes', iconName: 'tag', title: 'Catálogo Tarifario y Versiones de Planes' },
    { id: 'supplements', label: 'Suplementos', iconName: 'package', title: 'Catálogo de Suplementos y Stock' },
    ...(isAdmin() || isRecepcion() ? [
      { id: 'supplementOrders', label: 'Pedidos Suplementos', iconName: 'package', title: 'Bandeja de Pagos, Preparación y Retiro QR' },
    ] : []),
    { id: 'promotions', label: 'Promociones', iconName: 'percent', title: 'Gestión de Promociones y Descuentos' },
    ...(isAdmin() ? [{ id: 'reports', label: 'Reportes', iconName: 'calendar', title: 'Reportes y métricas' }] : []),
    ...(isAdmin() ? [{ id: 'incidents', label: 'Incidencias', iconName: 'alert-triangle', title: 'Gestión de incidencias' }] : []),
  ];

  const settingsItem = auditorOnly ? null : { id: 'settings', label: 'Configuración', iconName: 'settings' };

  const communicationItems = isAdmin() || isRecepcion() ? [
    ...(isAdmin() ? [{ id: 'reminders', label: 'Recordatorios', iconName: 'bell' }] : []),
    { id: 'facilities', label: 'Instalaciones VIP', iconName: 'tool' },
    { id: 'faq', label: 'Respuestas frecuentes', iconName: 'message-circle' },
    { id: 'communications', label: 'Seguimiento', iconName: 'send' },
  ] : [];

  const viewTitles = {
    home: 'Panel de Control Principal',
    clients: 'Directorio y Gestión de Miembros',
    operations: 'Operaciones: Cobros, Vigencias y Acceso',
    memberships: 'Membresías y Cobros en Mostrador',
    coverage: 'Seguimiento y Alertas de Vigencias',
    verification: 'Control Manual de Acceso en Recepción',
    plans: 'Catálogo de Planes y Tarifas',
    supplements: 'Catálogo de Suplementos y Stock',
    supplementOrders: 'Bandeja de Pedidos de Suplementos y Retiro QR',
    promotions: 'Gestión de Promociones y Descuentos',
    facilities: 'Áreas e Instalaciones del Gimnasio',
    reminders: 'Comunicaciones',
    faq: 'Comunicaciones',
    communications: 'Seguimiento',
    staff: 'Gestión de Personal y Roles',
    settings: 'Configuración Operativa del Sistema',
    reports: 'Reportes y Métricas',
    incidents: 'Incidencias Operativas',
  };

  const currentItem = {
    id: currentView,
    title: viewTitles[currentView] || 'VIP Center Fit',
  };

  const handleNavigate = (viewId) => {
    onNavigate(viewId);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'mobile-drawer-open' : ''}`}>
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
        navItems={navItems}
        communicationItems={communicationItems}
        settingsItem={settingsItem}
        user={user}
        onLogout={logout}
      />

      <div className="app-main-wrapper">
        <Header
          title={currentItem.title}
          subtitle="VIP CENTER FIT · LUXURY FITNESS"
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onNavigate={handleNavigate}
        />

        <main className="app-content-body" tabIndex="-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
