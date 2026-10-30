// ==============================================================================
// GYM VIP — Plantilla: AdminLayout (Shell Principal)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AdminLayout({ currentView, onNavigate, children }) {
  const { user, logout, isAdmin, isRecepcion } = useAuth();

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

  const navItems = [
    { id: 'home', label: 'Inicio', iconName: 'home', title: 'Panel de Control Principal' },
    { id: 'clients', label: 'Clientes', iconName: 'users', title: 'Directorio y Registro de Socios' },
    ...(isAdmin() || isRecepcion() ? [
      { id: 'coverage', label: 'Vigencias y alertas', iconName: 'calendar', title: 'Seguimiento y Alertas de Membresías' },
      { id: 'verification', label: 'Verificar ingreso', iconName: 'check-circle', title: 'Control Manual de Acceso en Recepción' },
    ] : []),
    { id: 'plans', label: 'Planes y tarifas', iconName: 'tag', title: 'Catálogo Tarifario y Versiones de Planes' },
    ...(isAdmin() || isRecepcion() ? [{ id: 'memberships', label: 'Membresías y cobros', iconName: 'credit-card', title: 'Contratación, Cobros y Renovaciones' }] : []),
    ...(isAdmin() ? [{ id: 'staff', label: 'Personal y roles', iconName: 'shield-check', title: 'Colaboradores y Control de Privilegios' }] : []),
    { id: 'settings', label: 'Configuración', iconName: 'settings', title: 'Parámetros Operativos del Sistema' },
  ];

  const currentItem = navItems.find((item) => item.id === currentView) || navItems[0];

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
        user={user}
        onLogout={logout}
      />

      <div className="app-main-wrapper">
        <Header
          title={currentItem.title}
          subtitle="VIP CENTER FIT · LUXURY FITNESS"
          user={user}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onLogout={logout}
        />

        <main className="app-content-body" tabIndex="-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
