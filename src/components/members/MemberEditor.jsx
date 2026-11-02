import React, { useEffect, useState } from 'react';
import { getClientByIdApi } from '../../api/clientApi';
import { updateClient } from '../../api/jorgeApi';
import MemberDialog from './MemberDialog';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
export default function MemberEditor({ client,token,onClose,onSaved }) {
  const [form,setForm]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let active=true;getClientByIdApi(client.id,token).then(c=>{const d=c.documents.find(d=>d.isPrimary)||c.documents[0]; if(active)setForm({firstName:c.firstName,lastName:c.lastName,email:c.email||'',phone:c.phone||'',countryCode:d?.countryCode||'PE',documentType:d?.documentType||'DNI',documentNumber:d?.documentNumber||'',notes:c.notes||'',version:c.version});}).catch(e=>active&&setError(e.message));return()=>{active=false;};},[client.id,token]);
  const field=name=>({value:form[name],onChange:e=>setForm(v=>({...v,[name]:e.target.value}))});
  async function submit(e){e.preventDefault();setBusy(true);setError('');try{await updateClient(client.id,{...form,phone:form.phone.trim()||null,email:form.email.trim()||null},token);onSaved();}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <MemberDialog title="Editar miembro" subtitle="Actualiza los datos del miembro." onClose={onClose} busy={busy}>{error&&<Alert variant="danger" message={error}/>}{!form?<p role="status">Cargando datos…</p>:<form onSubmit={submit}><fieldset disabled={busy}>
    <div className="member-form-grid"><label>Nombre<input className="form-input" required maxLength={100} {...field('firstName')}/></label><label>Apellido<input className="form-input" required maxLength={100} {...field('lastName')}/></label></div>
    <label>Correo electrónico<input className="form-input" type="email" maxLength={150} {...field('email')}/></label><label>Teléfono<input className="form-input" type="tel" maxLength={20} {...field('phone')}/></label>
    <div className="member-form-grid"><label>Tipo de documento<select className="form-input" {...field('documentType')}><option value="DNI">DNI</option><option value="CE">Carné de extranjería</option><option value="PASAPORTE">Pasaporte</option>{!['DNI','CE','PASAPORTE'].includes(form.documentType)&&<option value={form.documentType}>{form.documentType}</option>}</select></label><label>N.º de documento<input className="form-input" required maxLength={50} {...field('documentNumber')}/></label></div>
    <label>País del documento<input className="form-input" required maxLength={10} {...field('countryCode')}/></label><label>Notas<textarea className="form-input" rows={2} maxLength={2000} {...field('notes')}/></label>
    <div className="member-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar cambios'}</Button></div>
  </fieldset></form>}</MemberDialog>;
}
