// ==============================================================================
// GYM VIP — Componente Error Boundary con Soporte Sentry y UI Fallback Dark & Gold
// ==============================================================================

import React from 'react';
import * as Sentry from '@sentry/react';

function ErrorFallback({ error, resetError, section }) {
  const isDev = typeof import.meta !== 'undefined' && import.meta?.env?.DEV;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '260px',
        padding: '32px 24px',
        margin: '16px auto',
        maxWidth: '640px',
        backgroundColor: 'var(--color-bg-card, #1c1c1e)',
        border: '1px solid var(--color-border-card, #2c2c2e)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'var(--color-text-main, #f2f2f7)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: 'rgba(235, 87, 87, 0.12)',
          border: '1px solid rgba(235, 87, 87, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          fontSize: '24px',
        }}
      >
        ⚠️
      </div>

      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-gold, #d4af37)',
        }}
      >
        Ocurrió un problema inesperado {section ? `en ${section}` : 'en la vista'}
      </h3>

      <p
        style={{
          margin: '0 0 20px 0',
          fontSize: '14px',
          color: 'var(--color-text-muted, #8e8e93)',
          maxWidth: '460px',
          lineHeight: '1.5',
        }}
      >
        El incidente ha sido registrado automáticamente en nuestro sistema de monitoreo para su
        pronta resolución. Puedes intentar recargar esta sección.
      </p>

      {isDev && error && (
        <details
          style={{
            margin: '0 0 20px 0',
            padding: '12px',
            backgroundColor: '#121214',
            border: '1px solid #333',
            borderRadius: '6px',
            textAlign: 'left',
            width: '100%',
            fontSize: '12px',
            color: '#ff6b6b',
            overflowX: 'auto',
          }}
        >
          <summary style={{ cursor: 'pointer', marginBottom: '8px', color: '#aaa' }}>
            Detalles técnicos (solo visibles en desarrollo)
          </summary>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error.toString()}</pre>
        </details>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={resetError}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-gold, #d4af37)',
            color: '#121212',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Reintentar vista
        </button>

        <button
          type="button"
          onClick={() => (window.location.href = '/')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: 'var(--color-text-main, #f2f2f7)',
            border: '1px solid var(--color-border-card, #3a3a3c)',
            borderRadius: '6px',
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Ir al Inicio
        </button>
      </div>
    </div>
  );
}

export function SentryErrorBoundary({ children, section = 'la aplicación' }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} section={section} />
      )}
      beforeCapture={(scope) => {
        if (section) {
          scope.setTag('error_boundary_section', section);
        }
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

export default SentryErrorBoundary;
