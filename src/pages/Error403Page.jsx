// ==============================================================================
// GYM VIP — Vista de Error HTTP 403: Acceso Prohibido / Permisos Insuficientes
// Estilo Luxury Dark & Gold con Explicación de Roles Segregados (RBAC)
// ==============================================================================

import React from 'react';
import { Button } from '../components/common/Button';

export function Error403Page({
  userRole = 'No especificado',
  requiredRoles = ['GERENTE', 'ADMIN'],
  onGoHome,
}) {
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
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
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            HTTP 403 · FORBIDDEN
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
          Acceso Restringido por Rol
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary, #A0A0A8)',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          Su cuenta no dispone de los privilegios necesarios para ejecutar esta acción o acceder a este módulo del sistema.
        </p>

        {/* Detalle RBAC explicativo para defensa */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '10px',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '28px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--color-text-muted, #707078)' }}>Rol autenticado:</span>
            <span style={{ color: 'var(--color-gold, #D4AF37)', fontWeight: 700 }}>{userRole}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted, #707078)' }}>Roles con acceso permitido:</span>
            <span style={{ color: '#E0E0E6', fontWeight: 600 }}>
              {Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}
            </span>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', color: 'var(--color-text-muted, #808088)', fontSize: '12px', lineHeight: 1.4 }}>
            💡 <em>Nota de Arquitectura:</em> GYM VIP implementa segregación estricta de funciones. El rol <strong>ADMIN</strong> corresponde a Soporte TI/Sistemas (ETL e Infraestructura) y el rol <strong>GERENTE</strong> a la dirección ejecutiva y comercial.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button
            variant="primary"
            onClick={onGoHome || (() => { window.location.href = '/inicio'; })}
            style={{ minWidth: '160px' }}
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Error403Page;
