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

        {/* Acciones de Esquina Superior Derecha: Notificaciones y Apariencia */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
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
            onClick={() => setIsAppearanceOpen(true)}
            aria-label="Ajustes de apariencia"
            title="Ajustes de apariencia"
            aria-expanded={isAppearanceOpen}
          >
            <Icon name="settings" size={19} />
          </button>

          {/* Panel Desplegable Anclado de Notificaciones */}
          <NotificationsModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNavigate={onNavigate}
          />
        </div>
      </header>

      {/* Modal Accesible de Apariencia */}
      <AppearanceModal
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />
    </>
  );
}

export default Header;
