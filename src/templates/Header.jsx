// ==============================================================================
// GYM VIP — Plantilla: Header Compacto con Estilo Luxury Dark & Gold
// ==============================================================================

import React from 'react';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icons';

export function Header({
  title = 'Panel de Control Principal',
  subtitle = 'VIP CENTER FIT · LUXURY FITNESS',
  user,
  onOpenMobileMenu,
  onLogout,
}) {
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const primaryRole = user?.roles?.[0] || 'COLABORADOR';

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Botón Hamburger para Móvil */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú de navegación"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        <div>
          <span className="header-subtitle">{subtitle}</span>
          <h2 className="header-title">{title}</h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="header-user-pill">
          <div className="header-user-avatar" aria-hidden="true">
            {userInitial}
          </div>
          <div className="header-user-details">
            <span className="header-user-email">
              {user?.email}
            </span>
            <Badge variant={primaryRole === 'ADMIN' ? 'gold' : 'neutral'} style={{ fontSize: '10px', padding: '2px 8px' }}>
              {primaryRole}
            </Badge>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            className="btn btn-secondary btn-sm header-logout-btn"
            onClick={onLogout}
            title="Cerrar Sesión Activa"
            aria-label="Cerrar sesión"
          >
            <Icon name="log-out" size={15} color="var(--color-danger)" />
            <span className="header-logout-text">Salir</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
