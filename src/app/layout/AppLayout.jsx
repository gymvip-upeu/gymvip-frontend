import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import HomePage from '../../features/home/presentation/HomePage';
import ClientsPage from '../../features/clients/presentation/ClientsPage';
import PlansPage from '../../features/plans/presentation/PlansPage';
import StaffPage from '../../features/staff/presentation/StaffPage';

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('home');

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
    ...(isAdmin() ? [{ id: 'staff', label: 'Personal (HU-04)', icon: '🛡️', title: 'Personal y Control de Roles' }] : []),
  ];

  const currentItem = navItems.find((item) => item.id === currentView) || navItems[0];

  const handleNavigate = (viewId) => {
    setCurrentView(viewId);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'mobile-drawer-open' : ''}`}>
      {/* Backdrop para drawer móvil */}
      {isMobileOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Principal */}
      <aside
        id="app-sidebar"
        className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Menú principal de navegación"
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-logo" aria-hidden="true">👑</span>
            {!isCollapsed && (
              <div className="brand-text">
                <span className="brand-title">GYM VIP</span>
                <span className="brand-sub">LUXURY FITNESS</span>
              </div>
            )}
          </div>

          {/* Botón solo icono para alternar plegado */}
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            aria-controls="app-sidebar"
            aria-label={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            {isCollapsed ? (
              /* Icono PanelLeftOpen */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m14 9 3 3-3 3" />
              </svg>
            ) : (
              /* Icono PanelLeftClose */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m16 15-3-3 3-3" />
              </svg>
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          {!isCollapsed && (
            <div className="user-info-box">
              <span className="user-email" title={user?.email}>{user?.email}</span>
              <div style={{ marginTop: '4px' }}>
                <span className="badge badge-gold" style={{ fontSize: '10px' }}>
                  {user?.roles?.[0] || 'COLABORADOR'}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary sidebar-logout-btn"
            onClick={logout}
            aria-label="Cerrar sesión activa"
            title="Cerrar sesión"
          >
            <span aria-hidden="true">🚪</span>
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="app-main-wrapper">
        {/* Header Compacto (64px - 72px) */}
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Botón Hamburger para Móvil */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={isMobileOpen}
              aria-controls="app-sidebar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>

            <div>
              <span className="header-subtitle">VIP CENTER FIT · BASE SPRINT 1</span>
              <h2 className="header-title">{currentItem.title}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="header-user-pill">
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {user?.email}
              </span>
              <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                {user?.roles?.[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Cuerpo de la Página */}
        <main className="app-content-body" tabIndex="-1">
          {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentView === 'clients' && <ClientsPage />}
          {currentView === 'plans' && <PlansPage />}
          {currentView === 'staff' && <StaffPage />}
        </main>
      </div>
    </div>
  );
}
