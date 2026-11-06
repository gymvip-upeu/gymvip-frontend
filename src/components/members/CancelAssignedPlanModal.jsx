import React, { useState } from 'react';
import MemberDialog from './MemberDialog';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { dateLabel } from './memberUtils';
import closeIcon from '../../assets/icons/close-cancel-plan.svg';

export default function CancelAssignedPlanModal({ client, period, reason, setReason, busy, error, onClose, onConfirm }) {
  const [customReason, setCustomReason] = useState(false);
  const lastDay = new Date(new Date(`${String(period.end_date).slice(0, 10)}T12:00:00Z`).getTime() - 86400000).toISOString();
  return <MemberDialog title="Cancelar plan asignado" subtitle={`Modificar el plan de ${client.fullName || `${client.firstName} ${client.lastName}`}`} closeIcon={<img src={closeIcon} alt=""/>} onClose={onClose} busy={busy}>
    {error && <Alert variant="danger" message={error}/>}
    <form className="cancel-assigned-plan" onSubmit={onConfirm}><fieldset disabled={busy}>
      <div className="assigned-plan-summary"><div><strong>{period.plan_name}</strong><p>Inicio: {dateLabel(period.start_date)} · Vence: {dateLabel(lastDay)}</p></div><span className="assigned-plan-active">Activo</span></div>
      <p className="cancel-plan-warning">Se retirará la cobertura de este periodo. El pago y el historial se conservarán; esta operación no registra un reembolso.</p>
      <label>Motivo de cancelación<select className="form-input cancel-plan-select" value={customReason ? 'otro' : 'Sin especificar'} onChange={e => { const custom = e.target.value === 'otro'; setCustomReason(custom); setReason(custom ? '' : 'Sin especificar'); }}><option value="Sin especificar">Sin especificar</option><option value="otro">Otro motivo</option></select></label>
      {customReason && <label>Especifica el motivo<textarea className="form-input" required rows={2} maxLength={500} value={reason} onChange={e => setReason(e.target.value)}/></label>}
      <div className="member-actions assigned-plan-footer"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Volver</Button><Button type="submit" disabled={busy || !reason.trim()}>{busy ? 'Cancelando…' : 'Cancelar plan'}</Button></div>
    </fieldset></form>
  </MemberDialog>;
}
