// ==============================================================================
// GYM VIP — Componentes de Feedback: LoadingState y EmptyState
// ==============================================================================

import React from 'react';

export function LoadingState({ message = 'Cargando información del servidor...' }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ title = 'No se encontraron registros', subtitle, icon }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      {icon && <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{icon}</span>}
      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</p>
      {subtitle && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
