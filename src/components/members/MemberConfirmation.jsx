import React,{useState} from 'react';
import MemberDialog from './MemberDialog';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { getClientByIdApi } from '../../api/clientApi';
import { setMemberStatus,cancelMemberPeriod } from '../../api/memberApi';
export default function MemberConfirmation({client,period,token,onClose,onSaved}){
  const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const next=client.status==='ACTIVO'?'INACTIVO':'ACTIVO';
  async function confirm(e){e.preventDefault();setBusy(true);setError('');try{
    if(period)await cancelMemberPeriod(client.id,period.id,reason,token);
    else {const fresh=await getClientByIdApi(client.id,token);await setMemberStatus(client.id,{status:next,version:fresh.version},token);}
    onSaved();
  }catch(e){setError(e.message);}finally{setBusy(false);}}
  return <MemberDialog title={period?'Cancelar plan asignado':next==='INACTIVO'?'Desactivar miembro':'Activar miembro'} onClose={onClose} busy={busy}>{error&&<Alert variant="danger" message={error}/>}<form onSubmit={confirm}><fieldset disabled={busy}><p className="member-confirm-name">{client.fullName||`${client.firstName} ${client.lastName}`}</p>{period?<><div className="member-plan-preview"><strong>{period.plan_name}</strong></div><p className="member-help">Se retirará la cobertura de este periodo. El pago y el historial se conservarán; esta operación no registra un reembolso.</p><label>Motivo de cancelación<textarea className="form-input" required rows={3} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label></>:<p className="member-help">{next==='INACTIVO'?'El miembro no podrá ingresar ni acceder con su cuenta. Sus membresías y pagos se conservarán.':'Se habilitará al miembro. Su acceso al gimnasio dependerá de la vigencia de su membresía.'}</p>}<div className="member-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Volver</Button><Button type="submit" disabled={busy||(period&&!reason.trim())}>{busy?'Guardando…':period?'Confirmar cancelación':next==='INACTIVO'?'Desactivar':'Activar'}</Button></div></fieldset></form></MemberDialog>;
}
