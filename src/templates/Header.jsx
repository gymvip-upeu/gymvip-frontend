// ==============================================================================
// GYM VIP — Plantilla: Header Compacto (~68px)
// ==============================================================================

import React from 'react';
import { Badge } from '../components/common/Badge';

export function Header({
  title = 'Panel de Control Principal',
  subtitle = 'VIP CENTER FIT · BASE SPRINT 1',
  user,
  onOpenMobileMenu,
}) {
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="header-user-pill">
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {user?.email}
          </span>
          <Badge variant="gold" style={{ fontSize: '11px' }}>
            {user?.roles?.[0] || 'COLABORADOR'}
          </Badge>
        </div>
      </div>
    </header>
  );
}

export default Header;
