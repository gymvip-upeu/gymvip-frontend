// ==============================================================================
// GYM VIP — Componente: CoverageCard (Veredicto de Cobertura y Vigencia)
// Diseño de Alto Impacto Visual para Mostrador de Recepción
// ==============================================================================

import React from 'react';
import { Badge } from './Badge';
import { Icon } from './Icons';

export const stateLabel = (state) => ({
  VIGENTE: 'Vigente',
  POR_VENCER: 'Próxima a vencer',
  VENCIDO: 'Vencida',
  CANCELADA: 'Cancelada',
  PENDIENTE: 'Inicio futuro',
  SIN_MEMBRESIA: 'Sin membresía activa',
}[state] || state);

export const dateLabel = (value) => {
  if (!value) return '—';
  try {
    return new Date(`${value}T00:00:00Z`).toLocaleDateString('es-PE', { timeZone: 'UTC' });
  } catch {
    return value;
  }
};

export default function CoverageCard({ value, onGoToRenewal }) {
  if (!value) return null;

  const isAllowed = Boolean(value.allowed);
  const badgeVariant = isAllowed ? 'success' : (value.state === 'POR_VENCER' ? 'warning' : 'danger');

  return (
    <section
      className={`coverage-result-card ${isAllowed ? 'coverage-card-allowed' : 'coverage-card-denied'}`}
      aria-live="polite"
      style={{
        padding: '28px',
        borderRadius: 'var(--radius-xl)',
        border: `2px solid ${isAllowed ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
        background: isAllowed
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(21, 25, 34, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(21, 25, 34, 0.95) 100%)',
        margin: '24px 0',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-full)',
              background: isAllowed ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isAllowed ? 'var(--color-success)' : 'var(--color-danger)',
              flexShrink: 0,
            }}
          >
            <Icon name={isAllowed ? 'check-circle' : 'x-circle'} size={32} />
          </div>
          <div>
            <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: isAllowed ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
              VEREDICTO AUTORITATIVO
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '2px 0', color: 'var(--color-text-primary)' }}>
              {isAllowed ? 'INGRESO PERMITIDO' : 'INGRESO DENEGADO'}
            </h2>
          </div>
        </div>

        <Badge variant={badgeVariant} style={{ fontSize: '13px', padding: '6px 14px' }}>
          {stateLabel(value.state)}
        </Badge>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Socio Identificado:</span>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
          {value.fullName || value.clientName}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <span>{value.document}</span>
          <span>•</span>
          <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{value.memberCode}</span>
        </div>
        <p style={{ marginTop: '12px', fontSize: '14px', color: isAllowed ? 'var(--color-text-secondary)' : '#FCA5A5', lineHeight: 1.5 }}>
          <strong>Motivo:</strong> {value.reason}
        </p>
      </div>

      {/* Cuadrícula de Datos de Cobertura */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: 'var(--color-surface-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Plan Activo</span>
          <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{value.planName || 'Sin plan pagado'}</strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Inicio de Vigencia</span>
          <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{dateLabel(value.startDate)}</span>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Último Día Válido</span>
          <strong style={{ fontSize: '14px', color: isAllowed ? 'var(--color-gold)' : 'var(--color-danger)' }}>{dateLabel(value.lastIncludedDate)}</strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Días Restantes</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: (value.daysRemaining ?? 0) <= 7 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
            {value.daysRemaining !== null && value.daysRemaining !== undefined ? `${value.daysRemaining} días` : '0 días'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <small style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
          Verificado en {value.checkedAt ? new Date(value.checkedAt).toLocaleTimeString('es-PE', { timeZone: value.timezone || 'America/Lima' }) : '—'} (Hora oficial Lima). No registra asistencia física.
        </small>

        {!isAllowed && onGoToRenewal && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onGoToRenewal}
          >
            <Icon name="credit-card" size={14} />
            <span>Regularizar / Renovar Membresía</span>
          </button>
        )}
      </div>
    </section>
  );
}
