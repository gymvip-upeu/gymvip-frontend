// ==============================================================================
// GYM VIP — Vista de Error HTTP 401: Sesión No Autorizada o Expirada
// Estilo Luxury Dark & Gold con Acción Inmediata de Re-autenticación
// ==============================================================================

import React from 'react';
import { Button } from '../components/common/Button';

export function Error401Page({ onLoginClick, onGoHome }) {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: 'var(--color-bg-surface, #141418)',
          border: '1px solid var(--color-border-subtle, rgba(212, 175, 55, 0.2))',
          borderRadius: '16px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--color-gold, #D4AF37)',
            marginBottom: '20px',
            color: 'var(--color-gold, #D4AF37)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <div style={{ display: 'inline-block', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              color: 'var(--color-gold, #D4AF37)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            HTTP 401 · UNAUTHORIZED
          </span>
        </div>

        <h1
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--color-text-primary, #FFFFFF)',
            margin: '12px 0 8px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Sesión Requerida o Expirada
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary, #A0A0A8)',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          Para acceder a las funciones operativas y directivas de VIP Center Fit, debe identificarse con credenciales activas del sistema.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={onLoginClick || (() => { window.location.href = '/inicio'; })}
            style={{ minWidth: '160px' }}
          >
            Iniciar Sesión
          </Button>
          <Button
            variant="secondary"
            onClick={onGoHome || (() => { window.location.href = '/'; })}
            style={{ minWidth: '140px' }}
          >
            Ir al Portal
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Error401Page;
