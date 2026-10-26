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
    { id: 'home', label: 'Inicio', icon: '🏠', title: 'Panel de Control Principal' },
    { id: 'clients', label: 'Clientes (HU-01)', icon: '👥', title: 'Registro y Consulta de Socios' },
    { id: 'plans', label: 'Planes (HU-06)', icon: '📋', title: 'Catálogo de Tarifas y Membresías' },
    ...(isAdmin() || isRecepcion() ? [{ id: 'memberships', label: 'Membresías y cobros', icon: '💳', title: 'Contratación, Cobros y Renovaciones' }] : []),
    ...(isAdmin() ? [{ id: 'staff', label: 'Personal (HU-04)', icon: '🛡️', title: 'Personal y Control de Roles' }] : []),
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
          subtitle="VIP CENTER FIT · BASE SPRINT 1"
          user={user}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        <main className="app-content-body" tabIndex="-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
