// ==============================================================================
// GYM VIP — Modal de Ajustes de Apariencia y Preferencias Personales
// Accesible para todos los usuarios autenticados (ADMIN y RECEPCION)
// Persistencia por cuenta sin alterar la Configuración Operativa de negocio
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { useThemePreferences } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from './Icons';
import { Badge } from './Badge';

export function AppearanceModal({ isOpen, onClose }) {
  const { preferences, updatePreferences } = useThemePreferences();
  const { user } = useAuth();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Cierre accesible con tecla Escape y foco inicial
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTheme = preferences.theme || 'dark';
  const currentFontSize = preferences.fontSize || 'normal';
  const currentMotion = preferences.reducedMotion || 'system';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appearance-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="modal-content appearance-dialog"
        style={{
          maxWidth: '520px',
          padding: '28px',
          position: 'relative',
        }}
      >
        {/* Cabecera del Diálogo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                <Icon name="settings" size={18} />
              </span>
              <Badge variant="gold">PREFERENCIAS VISUALES</Badge>
            </div>
            <h2 id="appearance-title" style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: 'var(--color-text-primary)' }}>
              Ajustes de Apariencia
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              Personalice la experiencia visual en su dispositivo. Configurado para: <strong>{user?.email || 'Sesión Actual'}</strong>
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="btn-action-icon"
            onClick={onClose}
            aria-label="Cerrar ajustes de apariencia"
            title="Cerrar ajustes"
          >
            <Icon name="x-circle" size={18} />
          </button>
        </div>

        {/* Sección 1: Selección de Tema Visual */}
        <section style={{ marginBottom: '22px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'block', marginBottom: '8px' }}>
            Tema de Interfaz
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { id: 'dark', label: 'Oscuro', icon: 'moon', desc: 'Dark & Gold (Oficial)' },
              { id: 'light', label: 'Claro', icon: 'sun', desc: 'Fondo luminoso' },
              { id: 'system', label: 'Sistema', icon: 'monitor', desc: 'Automático del SO' },
            ].map((opt) => {
              const isSelected = currentTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updatePreferences({ theme: opt.id })}
                  className={`theme-option-card ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                    background: isSelected ? 'var(--color-gold-subtle)' : 'var(--color-surface-elevated)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center',
                    transition: 'all var(--transition-fast)',
                  }}
                  aria-pressed={isSelected}
                >
                  <span style={{ color: isSelected ? 'var(--color-gold)' : 'var(--color-text-secondary)' }}>
                    <Icon name={opt.icon} size={20} />
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: 'var(--color-text-primary)' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sección 2: Tamaño de Texto */}
        <section style={{ marginBottom: '22px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'block', marginBottom: '8px' }}>
            Tamaño de Tipografía
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { id: 'normal', label: 'Normal (Estándar)', desc: '14px base optimizado' },
              { id: 'large', label: 'Grande (+10%)', desc: 'Mayor legibilidad en mostrador' },
            ].map((opt) => {
              const isSelected = currentFontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updatePreferences({ fontSize: opt.id })}
                  className={`theme-option-card ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '12px 14px',
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
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, display: 'block', color: 'var(--color-text-primary)' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {opt.desc}
                    </span>
                  </div>
                  {isSelected && (
                    <span style={{ color: 'var(--color-gold)' }}>
                      <Icon name="check-circle" size={16} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Sección 3: Animaciones y Efectos */}
        <section style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'block', marginBottom: '8px' }}>
            Animaciones Visuales
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { id: 'system', label: 'Del Sistema', desc: 'Ajuste del SO' },
              { id: 'normal', label: 'Fluidas', desc: 'Transiciones activas' },
              { id: 'reduce', label: 'Reducidas', desc: 'Sin transiciones' },
            ].map((opt) => {
              const isSelected = currentMotion === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updatePreferences({ reducedMotion: opt.id })}
                  className={`theme-option-card ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border)',
                    background: isSelected ? 'var(--color-gold-subtle)' : 'var(--color-surface-elevated)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all var(--transition-fast)',
                  }}
                  aria-pressed={isSelected}
                >
                  <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500, display: 'block', color: 'var(--color-text-primary)' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Separación Funcional Explícita */}
        <div
          style={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
            Separación de Ámbitos:
          </strong>
          Estos ajustes son personales de visualización y se guardan únicamente en su navegador. Las reglas de negocio (umbral de vencimiento, tarifas y usuarios) corresponden al módulo <em>Configuración Operativa</em>, reservado a Administradores.
        </div>

        {/* Pie del Diálogo */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
            style={{ minHeight: '36px' }}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppearanceModal;

