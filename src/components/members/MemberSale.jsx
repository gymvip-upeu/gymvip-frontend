import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPlans } from '../../services/planService';
import { memberWorkspace } from '../../api/memberApi';
import { getPaymentMethods,quoteMembership,sellMembership,pendingStorageKey,loadPending,persistPending,isDefinitiveRejection } from '../../services/membershipService';
import MemberDialog from './MemberDialog';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { formatCurrencyPen } from '../../utils/formatters';
import { dateLabel, methodLabel } from './memberUtils';
export default function MemberSale({ client,onClose,onSaved }) {
  const {token,user}=useAuth();const storageKey=pendingStorageKey(user.email);
  const [plans,setPlans]=useState([]),[methods,setMethods]=useState([]),[planId,setPlanId]=useState(''),[method,setMethod]=useState(''),[reference,setReference]=useState(''),[notes,setNotes]=useState(''),[start,setStart]=useState('');
  const [operation,setOperation]=useState('ENROLL'),[quote,setQuote]=useState(null),[accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [pending,setPending]=useState(()=>{try{return loadPending(sessionStorage,storageKey);}catch{return null;}});const sending=useRef(false);
  useEffect(()=>{let active=true;Promise.all([fetchPlans('ACTIVO',token),getPaymentMethods(token),memberWorkspace(client.id,token)]).then(([p,m,w])=>{if(!active)return;setPlans(p);setMethods(m);setMethod(m[0]||'');setOperation(w.periods.length&&w.coverage.contractStatus!=='CANCELADA'?'RENEW':'ENROLL');}).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false;};},[client.id,token]);
  const invalidate=()=>{setQuote(null);setAccepted(false);};
  async function preview(e){e.preventDefault();setBusy(true);setError('');try{setQuote(await quoteMembership({clientId:client.id,planId,operation,...(start?{startDate:start}:{})},token));setAccepted(false);}catch(e){setError(e.message);setQuote(null);}finally{setBusy(false);}}
  async function pay(){if(sending.current)return;sending.current=true;setBusy(true);setError('');let attempt=pending;try{
    if(!attempt){attempt={key:crypto.randomUUID(),clientName:client.fullName,body:{clientId:client.id,planId,operation,quoteFingerprint:quote.fingerprint,amountPen:quote.pricePen,paymentMethod:method,reference:reference.trim()||null,notes:notes.trim()||null,startDate:start||null}};persistPending(sessionStorage,storageKey,attempt);setPending(attempt);}
    const result=await sellMembership(attempt.body,attempt.key,token);sessionStorage.removeItem(storageKey);setPending(null);window.dispatchEvent(new Event('gymvip-membership-changed'));onSaved(result);
  }catch(e){if(isDefinitiveRejection(e.status)){sessionStorage.removeItem(storageKey);setPending(null);invalidate();}setError(e.message);}finally{sending.current=false;setBusy(false);}}
  const locked=busy||!!pending;const selected=plans.find(p=>p.id===planId);
  return <MemberDialog title={operation==='RENEW'?'Renovar membresía':'Asignar plan'} subtitle={client.fullName||`${client.firstName} ${client.lastName}`} onClose={onClose} busy={busy}>{error&&<Alert variant="danger" message={error}/>}{pending?<div className="member-pending"><h3>Pago pendiente de confirmar</h3><p>{pending.clientName} · {formatCurrencyPen(pending.body.amountPen)}</p><p>Recupera el resultado con la misma operación para evitar un doble cobro.</p><Button disabled={busy} onClick={pay}>Comprobar pago pendiente</Button></div>:loading?<p role="status">Cargando planes y membresía…</p>:<form onSubmit={preview}><fieldset disabled={locked}>
    <label>Plan<select className="form-input" required value={planId} onChange={e=>{setPlanId(e.target.value);invalidate();}}><option value="">Selecciona un plan</option>{plans.map(p=><option key={p.id} value={p.id}>{p.name} · {formatCurrencyPen(p.pricePen)}</option>)}</select></label>
    {selected&&<div className="member-plan-preview"><p>{selected.durationDays} días · {selected.benefits||'Sin beneficios adicionales'}</p>{selected.conditions&&<p>Condiciones: {selected.conditions}</p>}</div>}
    {operation==='ENROLL'?<label>Fecha de inicio <span>(vacío: hoy)</span><input type="date" className="form-input" value={start} onChange={e=>{setStart(e.target.value);invalidate();}}/></label>:<p className="member-help">La renovación respeta los días vigentes. Si ya venció, comienza hoy.</p>}
    <div className="member-form-grid"><label>Monto (S/)<input className="form-input" readOnly value={selected?Number(selected.pricePen).toFixed(2):''} placeholder="Según el plan"/></label><label>Método de pago<select className="form-input" value={method} onChange={e=>setMethod(e.target.value)}>{methods.map(m=><option key={m} value={m}>{methodLabel(m)}</option>)}</select></label></div>
    <label>Número de operación <span>{method==='EFECTIVO'?'(opcional)':'(obligatorio)'}</span><input className="form-input" maxLength={100} value={reference} onChange={e=>setReference(e.target.value)}/></label>
    <label>Notas del pago <span>(opcional)</span><textarea className="form-input" rows={2} maxLength={500} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
    {quote&&<div className="member-payment-summary"><strong>{quote.planName} · {formatCurrencyPen(quote.pricePen)}</strong><p>Inicio: {dateLabel(quote.startDate)}<br/>Último día válido: {dateLabel(quote.lastIncludedDate)}</p><label className="member-check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>Confirmo que recibí el pago completo e informé las fechas y condiciones.</label></div>}
    <div className="member-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>{quote?<Button type="button" disabled={locked||!accepted||!method||(method!=='EFECTIVO'&&!reference.trim())} onClick={pay}>{busy?'Guardando…':'Confirmar pago y asignar'}</Button>:<Button type="submit" disabled={locked||!planId}>{busy?'Calculando…':'Revisar y continuar'}</Button>}</div>
  </fieldset></form>}</MemberDialog>;
}
