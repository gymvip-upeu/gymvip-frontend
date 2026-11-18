// ==============================================================================
// GYM VIP — Popover / Panel Desplegable de Ajustes de Apariencia y Accesibilidad
// Anclado directamente al control de ajustes del Header (sin backdrop bloqueante)
// Permite previsualizar los cambios en tiempo real en la pantalla
// Accesible para todos los usuarios autenticados (ADMIN y RECEPCION)
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { useThemePreferences } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from './Icons';
import { Badge } from './Badge';

export function AppearanceModal({ isOpen, onClose }) {
  const { preferences, updatePreferences } = useThemePreferences();
  const { user } = useAuth();
  const panelRef = useRef(null);

  // Cierre accesible con tecla Escape y clic exterior
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Ignorar clic si provino del propio botón del header que dispara la apertura
        const settingsBtn = document.querySelector('.header-icon-btn[aria-label="Ajustes de apariencia"]');
        if (settingsBtn && settingsBtn.contains(e.target)) return;
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTheme = preferences?.theme || 'dark';
  const currentFontSize = preferences?.fontSize || 'normal';
  const currentMotion = preferences?.reducedMotion || 'system';

  return (
    <div
      ref={panelRef}
      className="appearance-dropdown-panel"
      role="region"
      aria-label="Panel de Ajustes de Apariencia"
    >
      {/* Encabezado del Popover */}
      <div className="appearance-dropdown-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
            <Icon name="settings" size={17} />
          </span>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Ajustes de Apariencia
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Cambios visuales en tiempo real
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-action-icon"
          onClick={onClose}
          aria-label="Cerrar ajustes"
          title="Cerrar ajustes"
          style={{ width: '28px', height: '28px' }}
        >
          <Icon name="x-circle" size={16} />
        </button>
      </div>

      {/* Cuerpo del Popover con Opciones Visuales */}
      <div className="appearance-dropdown-body">
        {/* Identificación de Usuario */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', paddingBottom: '4px' }}>
          <span>Perfil activo:</span>
          <Badge variant="gold" style={{ fontSize: '10px' }}>
            {user?.email || 'Sesión Actual'}
          </Badge>
        </div>

        {/* Sección 1: Tema de Interfaz */}
        <section>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>
            Tema de Interfaz
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { id: 'dark', label: 'Oscuro', icon: 'moon', desc: 'Dark & Gold' },
              { id: 'light', label: 'Claro', icon: 'sun', desc: 'Luminoso' },
              { id: 'system', label: 'Sistema', icon: 'monitor', desc: 'Del SO' },
            ].map((opt) => {
              const isSelected = currentTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updatePreferences({ theme: opt.id })}
                  className={`theme-option-card ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                    background: isSelected ? 'var(--color-gold-subtle)' : 'var(--color-surface-elevated)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    transition: 'all var(--transition-fast)',
                  }}
                  aria-pressed={isSelected}
                >
                  <span style={{ color: isSelected ? 'var(--color-gold)' : 'var(--color-text-secondary)' }}>
                    <Icon name={opt.icon} size={18} />
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500, color: 'var(--color-text-primary)' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sección 2: Tamaño de Tipografía */}
        <section>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>
            Tamaño de Tipografía
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { id: 'normal', label: 'Normal (14px)', desc: 'Estándar balanceado' },
              { id: 'large', label: 'Grande (+10%)', desc: 'Legibilidad mostrador' },
            ].map((opt) => {
              const isSelected = currentFontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updatePreferences({ fontSize: opt.id })}
                  className={`theme-option-card ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                    background: isSelected ? 'var(--color-gold-subtle)' : 'var(--color-surface-elevated)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                  aria-pressed={isSelected}
                >
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500, display: 'block', color: 'var(--color-text-primary)' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {opt.desc}
                    </span>
                  </div>
                  {isSelected && (
                    <span style={{ color: 'var(--color-gold)' }}>
                      <Icon name="check-circle" size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Sección 3: Animaciones y Transiciones */}
        <section>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'block', marginBottom: '6px' }}>
            Animaciones Visuales
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { id: 'system', label: 'Sistema', desc: 'Preferencia SO' },
              { id: 'normal', label: 'Fluidas', desc: 'Completas' },
              { id: 'reduce', label: 'Reducidas', desc: 'Sin transición' },
            ].map((opt) => {
              const isSelected = currentMotion === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updatePreferences({ reducedMotion: opt.id })}
                  className={`theme-option-card ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                    background: isSelected ? 'var(--color-gold-subtle)' : 'var(--color-surface-elevated)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all var(--transition-fast)',
                  }}
                  aria-pressed={isSelected}
                >
                  <span style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500, display: 'block', color: 'var(--color-text-primary)' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Nota de Separación de Ámbitos */}
        <div
          style={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
          }}
        >
          <strong style={{ color: 'var(--color-text-primary)' }}>Aviso: </strong>
          Estas preferencias son personales del navegador. Los parámetros de negocio corresponden a <em>Configuración Operativa</em>.
        </div>
      </div>

      {/* Pie del Popover */}
      <div className="appearance-dropdown-footer">
        <span style={{ color: 'var(--color-text-muted)' }}>
          Aplicado inmediatamente
        </span>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onClose}
          style={{ minHeight: '28px', fontSize: '11px', padding: '4px 12px' }}
        >
          Listo
        </button>
      </div>
    </div>
  );
}

export const AppearanceDropdown = AppearanceModal;
export default AppearanceModal;
