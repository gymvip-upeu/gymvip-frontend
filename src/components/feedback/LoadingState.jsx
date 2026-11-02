// ==============================================================================
// GYM VIP — Componentes de Feedback: LoadingState y EmptyState
// ==============================================================================

import React from 'react';
import { LoadingDotsSpinner } from './LoadingDotsSpinner';

export function LoadingState({
  message = 'Cargando información del servidor...',
  spinnerSize = 42,
  color = 'var(--color-gold, #D4AF37)',
}) {
  return (
    <div
      className="gymvip-loading-card"
      role="status"
      aria-live="polite"
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'var(--color-text-secondary)',
      }}
    >
      <LoadingDotsSpinner size={spinnerSize} color={color} label={message} />
      <p style={{ margin: 0, fontWeight: 500, fontSize: '14px', color }}>
        {message}
      </p>
    </div>
  );
}

export function EmptyState({ title = 'No se encontraron registros', subtitle, icon }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }} role="status">
      {icon && <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{icon}</span>}
      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>{title}</p>
      {subtitle && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default LoadingState;
