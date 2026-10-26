import React from 'react';
import { Badge } from './Badge';
export const stateLabel = state => ({ VIGENTE: 'Vigente', POR_VENCER: 'Próxima a vencer', VENCIDO: 'Vencida', CANCELADA: 'Cancelada', PENDIENTE: 'Inicio futuro', SIN_MEMBRESIA: 'Sin membresía' }[state] || state);
export const dateLabel = value => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '—';
export default function CoverageCard({ value }) {
  if (!value) return null;
  return <section className={`coverage-result ${value.allowed ? 'coverage-allowed' : 'coverage-denied'}`} aria-live="polite">
    <h3>{value.allowed ? 'Ingreso permitido' : 'Ingreso no permitido'}</h3>
    <p><strong>{value.fullName}</strong> · {value.document || value.memberCode}</p>
    <Badge variant={value.allowed ? 'success' : 'danger'}>{stateLabel(value.state)}</Badge><p>{value.reason}</p>
    <dl className="jorge-details"><div><dt>Plan</dt><dd>{value.planName || 'Sin plan pagado'}</dd></div>
      <div><dt>Inicio</dt><dd>{dateLabel(value.startDate)}</dd></div><div><dt>Último día válido</dt><dd>{dateLabel(value.lastIncludedDate)}</dd></div>
      <div><dt>Verificado por el servidor</dt><dd>{new Date(value.checkedAt).toLocaleString('es-PE', { timeZone: value.timezone })} · Lima</dd></div></dl>
    <small>Consulta manual de membresía. No registra asistencia.</small>
  </section>;
}
