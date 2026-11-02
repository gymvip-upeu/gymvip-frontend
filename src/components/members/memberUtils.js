export const dateLabel = value => value ? new Date(`${String(value).slice(0,10)}T12:00:00Z`).toLocaleDateString('es-PE',{timeZone:'America/Lima'}) : '—';
export const methodLabel = value => ({EFECTIVO:'Efectivo',YAPE:'Yape',PLIN:'Plin',TRANSFERENCIA:'Transferencia',POS:'POS'}[value]||value);
export const stateLabel = value => ({VIGENTE:'Vigente',POR_VENCER:'Por vencer',VENCIDO:'Vencida',CANCELADA:'Cancelada',SIN_MEMBRESIA:'Sin plan',PENDIENTE:'Inicio futuro',ACTIVO:'Activo',INACTIVO:'Inactivo'}[value]||'Sin verificar');
export function periodState(period, coverage) {
  if(period.cancelled_at_utc || coverage.contractStatus==='CANCELADA') return 'CANCELADA';
  if(!period.paid) return 'PENDIENTE';
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(coverage.checkedAt));
  const get=type=>parts.find(p=>p.type===type).value; const day=`${get('year')}-${get('month')}-${get('day')}`;
  if(String(period.start_date).slice(0,10)>day)return 'PENDIENTE';
  if(String(period.end_date).slice(0,10)<=day)return 'VENCIDO';
  return 'VIGENTE';
}

export function utcInstant(value) { const s=String(value); return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(s)?s:s+'Z'); }
export const utcDateLabel = value => value ? utcInstant(value).toLocaleDateString('es-PE',{timeZone:'America/Lima'}) : '—';
export const utcTimeLabel = value => value ? utcInstant(value).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit'}) : '—';

export const planTypeLabel = days => ({30:'Mensual',90:'Trimestral',180:'Semestral',365:'Anual'}[days] || 'Personalizado');
