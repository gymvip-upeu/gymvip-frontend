// ==============================================================================
// GYM VIP — Plantilla: Sidebar Colapsable y Drawer Móvil Luxury Dark & Gold
// ==============================================================================

import React from 'react';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icons';

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
            <span className="brand-logo" aria-hidden="true">
              <Icon name="crown" size={24} color="var(--color-gold)" />
            </span>
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
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Lista de Navegación */}
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
                <span className="nav-icon">
                  <Icon
                    name={item.iconName || 'home'}
                    size={19}
                    color={isActive ? 'var(--color-gold)' : 'var(--color-text-secondary)'}
                  />
                </span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Zona Inferior: Información del Usuario y Logout */}
        <div className="sidebar-bottom">
          {!isCollapsed && (
            <div className="user-info-box">
              <span className="user-email" title={user?.email}>
                {user?.email}
              </span>
              <div style={{ marginTop: '4px' }}>
                <Badge variant={user?.roles?.[0] === 'ADMIN' ? 'gold' : 'neutral'} style={{ fontSize: '10px' }}>
                  {user?.roles?.[0] || 'COLABORADOR'}
                </Badge>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm sidebar-logout-btn"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <Icon name="log-out" size={16} color="var(--color-danger)" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
