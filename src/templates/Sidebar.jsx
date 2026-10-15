// ==============================================================================
// GYM VIP — Plantilla: Sidebar Colapsable y Drawer Móvil
// ==============================================================================

import React from 'react';
import { Badge } from '../components/common/Badge';

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  currentView,
  onNavigate,
  navItems,
  user,
  onLogout,
}) {
  return (
    <>
      {/* Backdrop para drawer móvil */}
      {isMobileOpen && (
        <div
          className="drawer-backdrop"
          onClick={onCloseMobile}
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

          {/* Botón solo icono para alternar plegado (sin texto 'Contraer') */}
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
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
                onClick={() => onNavigate(item.id)}
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
                <Badge variant="gold" style={{ fontSize: '10px' }}>
                  {user?.roles?.[0] || 'COLABORADOR'}
                </Badge>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary sidebar-logout-btn"
            onClick={onLogout}
            aria-label="Cerrar sesión activa"
            title="Cerrar sesión"
          >
            <span aria-hidden="true">🚪</span>
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
