// ==============================================================================
// GYM VIP — Componentes Reutilizables de Guía Contextual y Módulos Introductorios
// Ocultables mediante la preferencia "Mostrar guías y consejos" (Modo Compacto).
// NUNCA utilizar para errores, alertas de seguridad o avisos legales obligatorios.
// ==============================================================================

import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { Icon } from './Icons';

export function GuideHint({ title, description, children }) {
  const { showGuides } = usePreferences();
  if (!showGuides) return null;

  return (
    <div
      role="note"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md, 10px)',
        background: 'rgba(212, 175, 55, 0.08)',
        border: '1px solid rgba(212, 175, 55, 0.28)',
        color: 'var(--color-text-secondary)',
        fontSize: '13px',
        lineHeight: 1.45,
        marginBottom: '16px',
      }}
    >
      <span style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
        <Icon name="info" size={16} />
      </span>
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
            {title}
          </div>
        )}
        {description && <div>{description}</div>}
        {children}
      </div>
    </div>
  );
}

export const ContextualHelp = GuideHint;
export const FeatureIntroduction = GuideHint;
