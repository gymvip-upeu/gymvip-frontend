// ==============================================================================
// GYM VIP — Plantilla: Header Compacto con Estilo Luxury Dark & Gold
// Incluye Accesos a Notificaciones y Ajustes de Apariencia
// ==============================================================================

import React, { useState } from 'react';
import { Icon } from '../components/common/Icons';
import { NotificationsModal } from '../components/common/NotificationsModal';
import { AppearanceModal } from '../components/common/AppearanceModal';
import { GymVipLogo } from '../components/common/GymVipLogo';

export function Header({
  title = 'Panel de Control Principal',
  subtitle = 'VIP CENTER FIT · LUXURY FITNESS',
  onOpenMobileMenu,
  onNavigate,
  onOpenCommandPalette,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

  return (
    <>
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

          {/* Logotipo Vectorial Institucional GYM VIP */}
          <div className="header-brand-mark" aria-hidden="true">
            <GymVipLogo size={36} idSuffix="header" />
          </div>

          <div>
            <span className="header-subtitle">{subtitle}</span>
            <h2 className="header-title">{title}</h2>
          </div>
        </div>

        {/* Acciones de Esquina Superior Derecha: Búsqueda, Notificaciones y Apariencia */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          {/* Botón de Búsqueda Rápida / Command Palette (Ctrl + K) */}
          {onOpenCommandPalette && (
            <button
              type="button"
              className="header-search-btn"
              onClick={onOpenCommandPalette}
              aria-label="Buscar en VIP Center Fit (Ctrl+K)"
              title="Búsqueda rápida y comandos (Ctrl+K)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '8px',
                color: '#CBD5E1',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon name="search" size={14} />
              <span className="search-placeholder-text">Buscar...</span>
              <kbd style={{
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#D4AF37',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>Ctrl K</kbd>
            </button>
          )}

          <button
            type="button"
            className="header-icon-btn"
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsAppearanceOpen(false);
            }}
            aria-label="Notificaciones"
            title="Notificaciones"
            aria-expanded={isNotificationsOpen}
            aria-haspopup="true"
          >
            <Icon name="bell" size={19} />
          </button>

          <button
            type="button"
            className="header-icon-btn"
            onClick={() => {
              setIsAppearanceOpen((prev) => !prev);
              setIsNotificationsOpen(false);
            }}
            aria-label="Ajustes de apariencia"
            title="Ajustes de apariencia"
            aria-expanded={isAppearanceOpen}
            aria-haspopup="true"
          >
            <Icon name="settings" size={19} />
          </button>

          {/* Panel Desplegable Anclado de Notificaciones */}
          <NotificationsModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNavigate={onNavigate}
          />

          {/* Popover Anclado de Apariencia y Preferencias Visuales */}
          <AppearanceModal
            isOpen={isAppearanceOpen}
            onClose={() => setIsAppearanceOpen(false)}
          />
        </div>
      </header>
    </>
  );
}

export default Header;
