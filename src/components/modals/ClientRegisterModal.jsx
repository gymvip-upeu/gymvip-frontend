import React, { useState } from 'react';
import { registerMember } from '../../api/memberApi';
import { validateClientRegistration } from '../../validators/clientValidator';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import MemberDialog from '../members/MemberDialog';
export default function ClientRegisterModal({ token, onClose, onSuccess }) {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', birthDate:'', documentType:'DNI', documentNumber:'', notes:'', createAccess:true });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const field = name => ({ value:form[name], onChange:e => setForm(v => ({...v,[name]:e.target.value})) });
  async function submit(e) {
    e.preventDefault(); const errors = validateClientRegistration(form); if(errors.length) { setError(errors.join(' ')); return; }
    setBusy(true); setError('');
    try {
      const { notes,createAccess,...client } = form;
      const result = await registerMember({ client:{...client,countryCode:'PE'},notes,createAccess },token);
      if (!result.client?.id || (createAccess && !result.credentials?.temporaryPassword)) throw new Error('No se pudo confirmar el registro completo. Consulta la lista antes de reintentar.');
      onSuccess(result.client,result.credentials);
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  return <MemberDialog title="Nuevo miembro" subtitle="Ingresa los datos del nuevo miembro." busy={busy} onClose={onClose}>{error && <Alert variant="danger" message={error}/>}<form onSubmit={submit}><fieldset disabled={busy}>
    <div className="member-form-grid"><label>Nombre<input className="form-input" required maxLength={100} placeholder="Ej. Juan" {...field('firstName')}/></label><label>Apellido<input className="form-input" required maxLength={100} placeholder="Ej. Morales" {...field('lastName')}/></label></div>
    <label>Correo electrónico <span>(opcional)</span><input className="form-input" type="email" maxLength={150} placeholder="correo@ejemplo.com" {...field('email')}/></label>
    <div className="member-form-grid"><label>Teléfono <span>(opcional)</span><input className="form-input" type="tel" maxLength={20} placeholder="999888777" {...field('phone')}/></label><label>Fecha de nacimiento<input className="form-input" type="date" required {...field('birthDate')}/></label></div>
    <div className="member-form-grid"><label>Tipo de documento<select className="form-input" {...field('documentType')}><option value="DNI">DNI</option><option value="CE">Carné de extranjería</option><option value="PASAPORTE">Pasaporte</option></select></label><label>N.º de documento<input className="form-input" required maxLength={50} {...field('documentNumber')}/></label></div>
    <label>Notas <span>(opcional)</span><textarea className="form-input" rows={2} maxLength={2000} placeholder="Observaciones y preferencias…" {...field('notes')}/></label>
    <label className="member-check"><input type="checkbox" checked={form.createAccess} onChange={e=>setForm(v=>({...v,createAccess:e.target.checked}))}/>Crear acceso de cliente con contraseña temporal</label><p className="member-help">El registro requiere mayoría de edad. La membresía se asigna después, al registrar el pago.</p>
    <div className="member-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Creando…':'Crear miembro'}</Button></div>
  </fieldset></form></MemberDialog>;
}
