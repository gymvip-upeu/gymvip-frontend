import React from 'react';
import MemberDialog from './MemberDialog';
import { Button } from '../common/Button';
import { dateLabel, periodState } from './memberUtils';
import closeIcon from '../../assets/icons/close-assigned-plan.svg';

export default function AssignedPlanModal({ client, period, coverage, onClose, onExtend, onCancel }) {
  const state = periodState(period, coverage);
  const current = ['VIGENTE', 'POR_VENCER'].includes(state);
  const lastDay = new Date(new Date(`${String(period.end_date).slice(0, 10)}T12:00:00Z`).getTime() - 86400000).toISOString();
  return <MemberDialog title="Editar plan asignado" subtitle={`Modificar el plan de ${client.fullName}`} closeIcon={<img src={closeIcon} alt=""/>} onClose={onClose}>
    <div className="assigned-plan-summary"><div><strong>{period.plan_name}</strong><p>Inicio: {dateLabel(period.start_date)} · Vence: {dateLabel(lastDay)}</p></div><span className="assigned-plan-active">Activo</span></div>
    <div className="assigned-plan-options"><button type="button" disabled={!current || client.status !== 'ACTIVO'} onClick={onExtend}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-9 3v4m-2-2h4"/></svg>Extender vencimiento</button><button className="assigned-plan-cancel" type="button" disabled={!current} onClick={onCancel}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg>Cancelar plan</button></div>
    <div className="member-actions assigned-plan-footer"><Button onClick={onClose}>Aceptar</Button></div>
  </MemberDialog>;
}
