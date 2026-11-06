// ==============================================================================
// GYM VIP — Componentes de Feedback: LoadingState y EmptyState
// Estilo Luxury Dark & Gold con Logotipo Vectorial Animado y Accesibilidad
// ==============================================================================

import React from 'react';
import { GymVipLogo } from '../common/GymVipLogo';

export function LoadingState({
  message = 'Cargando información del servidor...',
  spinnerSize = 48,
  color = 'var(--color-gold, #D4AF37)',
}) {
  return (
    <div
      className="gymvip-loading-card"
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'var(--color-text-secondary)',
      }}
    >
      <GymVipLogo size={spinnerSize} animated={true} />
      <p style={{ margin: 0, fontWeight: 500, fontSize: '14px', color, letterSpacing: '0.3px' }}>
        {message}
      </p>
      <span className="sr-only">Cargando datos, por favor espere...</span>
    </div>
  );
}

export function EmptyState({ title = 'No se encontraron registros', subtitle, icon, action }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }} role="status">
      {icon && <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{icon}</span>}
      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>{title}</p>
      {subtitle && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '0 0 14px 0' }}>
          {subtitle}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export default LoadingState;
