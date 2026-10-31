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
    { id: 'clients', label: 'Miembros', icon: '♙', title: 'Miembros' },
    { id: 'plans', label: 'Planes', icon: '▤', title: 'Planes' },
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
        currentView={['coverage','verification','memberships'].includes(currentView) ? 'clients' : currentView}
        onNavigate={handleNavigate}
        navItems={navItems}
        user={user}
        onLogout={logout}
      />

      <div className="app-main-wrapper">
        <Header
          title={currentItem.title}
          subtitle="VIP CENTER FIT"
          user={user}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        <main className="app-content-body" tabIndex="-1">
          {['clients','coverage','verification','memberships'].includes(currentView) && <nav className="member-tabs" aria-label="Gestión de miembros">{[{id:'clients',label:'Miembros'},{id:'memberships',label:'Membresías y pagos'},{id:'coverage',label:'Vencimientos'},{id:'verification',label:'Verificar ingreso'}].map(item => <button key={item.id} className={currentView === item.id ? 'active' : ''} onClick={() => handleNavigate(item.id)}>{item.label}</button>)}</nav>}
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
