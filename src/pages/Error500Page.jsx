// ==============================================================================
// GYM VIP — Vista de Error HTTP 500: Error Interno del Servidor
// Estilo Luxury Dark & Gold con Código de Correlación Sentry y Reintento
// ==============================================================================

import React, { useState } from 'react';
import { Button } from '../components/common/Button';

export function Error500Page({
  correlationId = null,
  errorMessage = 'Ha ocurrido una anomalía inesperada al procesar su solicitud en el servidor.',
  onRetry,
  onGoHome,
}) {
  const [copied, setCopied] = useState(false);
  const activeCorrelationId = correlationId || `corr-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeCorrelationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

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
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--color-bg-surface, #141418)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
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
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            marginBottom: '20px',
            color: '#EF4444',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
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
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            HTTP 500 · INTERNAL SERVER ERROR
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
          Error Inesperado del Servidor
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary, #A0A0A8)',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          {errorMessage}
        </p>

        {/* Bloque de Correlation ID */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '28px',
            fontSize: '12px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted, #707078)' }}>ID de Correlación Sentry/Spring:</span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? '#10B981' : 'var(--color-gold, #D4AF37)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 6px',
              }}
            >
              {copied ? '✓ Copiado' : 'Copiar ID'}
            </button>
          </div>
          <div
            style={{
              marginTop: '6px',
              fontFamily: 'monospace',
              color: 'var(--color-gold, #D4AF37)',
              fontSize: '12px',
              wordBreak: 'break-all',
            }}
          >
            {activeCorrelationId}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <Button
              variant="primary"
              onClick={onRetry}
              style={{ minWidth: '150px' }}
            >
              Reintentar
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onGoHome || (() => { window.location.href = '/inicio'; })}
            style={{ minWidth: '150px' }}
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Error500Page;
