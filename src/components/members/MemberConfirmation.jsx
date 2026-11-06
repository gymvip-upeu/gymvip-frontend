import React, { useState } from 'react';
import MemberDialog from './MemberDialog';
import CancelAssignedPlanModal from './CancelAssignedPlanModal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { getClientByIdApi } from '../../api/clientApi';
import { setMemberStatus, cancelMemberPeriod } from '../../api/memberApi';

export default function MemberConfirmation({ client, period, token, onClose, onSaved }) {
  const [reason, setReason] = useState(period ? 'Sin especificar' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const next = client.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const deactivating = !period && next === 'INACTIVO';
  const memberName = client.fullName || `${client.firstName} ${client.lastName}`;

  async function confirm(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (period) await cancelMemberPeriod(client.id, period.id, reason, token);
      else {
        const fresh = await getClientByIdApi(client.id, token);
        await setMemberStatus(client.id, { status: next, version: fresh.version }, token);
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (period) {
    return (
      <CancelAssignedPlanModal
        client={client}
        period={period}
        reason={reason}
        setReason={setReason}
        busy={busy}
        error={error}
        onClose={onClose}
        onConfirm={confirm}
      />
    );
  }

  return (
    <MemberDialog
      showClose={!!period}
      icon={
        deactivating ? (
          <svg className="member-confirmation-icon member-deactivation-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.3 3.9 2.1 18.1A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
            <path d="M12 9v4m0 4h.01"/>
          </svg>
        ) : !period ? (
          <svg className="member-confirmation-icon member-activation-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="m8 12 3 3 5-6"/>
          </svg>
        ) : null
      }
      title={next === 'INACTIVO' ? 'Desactivar miembro' : 'Activar miembro'}
      onClose={onClose}
      busy={busy}
    >
      {error && <Alert variant="danger" message={error} />}
      <form className="member-status-confirmation" onSubmit={confirm}>
        <fieldset disabled={busy}>
          <p className={deactivating ? 'member-help member-deactivation-message' : 'member-help member-activation-message'}>
            {deactivating
              ? `${memberName} no podrá ingresar ni acceder a su cuenta. Sus membresías y pagos se conservarán.`
              : `${memberName} podrá acceder a su cuenta. Su ingreso al gimnasio dependerá de la vigencia de su membresía.`}
          </p>
          <div className="member-actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : next === 'INACTIVO' ? 'Desactivar' : 'Activar'}</Button>
          </div>
        </fieldset>
      </form>
    </MemberDialog>
  );
}
