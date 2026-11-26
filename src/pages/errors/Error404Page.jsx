// ==============================================================================
// GYM VIP — Vista de Error HTTP 404: Ruta No Encontrada
// Estilo Luxury Dark & Gold con Sugerencias de Navegación y Command Palette
// ==============================================================================

import React from 'react';
import { Button } from '../../components/common/Button';

export function Error404Page({ requestedPath = '', onNavigate }) {
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
          maxWidth: '540px',
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
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
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
            HTTP 404 · NOT FOUND
          </span>
        </div>

        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--color-text-primary, #FFFFFF)',
            margin: '12px 0 8px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Ruta No Encontrada
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary, #A0A0A8)',
            lineHeight: 1.6,
            marginBottom: '16px',
          }}
        >
          La página solicitada{' '}
          {requestedPath ? (
            <code style={{ color: 'var(--color-gold, #D4AF37)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
              {requestedPath}
            </code>
          ) : (
            'en este enlace'
          )}{' '}
          no existe en el catálogo de navegación de GYM VIP.
        </p>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-text-muted, #707078)',
            marginBottom: '28px',
          }}
        >
          💡 Tip: Puede pulsar <kbd style={{ padding: '2px 6px', backgroundColor: '#222', borderRadius: '4px', border: '1px solid #444', color: '#FFF' }}>Ctrl + K</kbd> en cualquier momento para buscar y acceder a cualquier módulo instantáneamente.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => {
              if (onNavigate) onNavigate('home');
              else window.location.href = '/inicio';
            }}
            style={{ minWidth: '150px' }}
          >
            Ir al Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (onNavigate) onNavigate('clients');
              else window.location.href = '/miembros';
            }}
            style={{ minWidth: '150px' }}
          >
            Directorio Miembros
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Error404Page;
