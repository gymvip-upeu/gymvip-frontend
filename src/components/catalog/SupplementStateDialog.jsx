import React,{useState} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateSupplementState } from '../../api/catalogApi';
import MemberDialog from '../members/MemberDialog';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { presentationLabel } from './catalogUtils';
export default function SupplementStateDialog({item,onClose,onSaved}) {
  const {token}=useAuth();const [availability,setAvailability]=useState(item.availability),[published,setPublished]=useState(item.published),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e){e.preventDefault();setBusy(true);setError('');try{onSaved(await updateSupplementState(item,{availability,published},token));}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <MemberDialog title="Cambiar disponibilidad" subtitle={`${item.name} · ${presentationLabel(item)}`} onClose={onClose} busy={busy}>
    {error&&<Alert variant="danger" message={error}/>}<form onSubmit={submit}><fieldset disabled={busy} className="catalog-fieldset"><div className="catalog-availability-options">{[['DISPONIBLE','Disponible para consulta'],['AGOTADO','Agotado temporalmente']].map(([value,label])=><label key={value} className={availability===value?'selected':''}><input type="radio" name="supplement-availability" value={value} checked={availability===value} onChange={()=>setAvailability(value)}/>{label}</label>)}</div>
    <p className="catalog-help">El producto seguirá en el catálogo con este estado. La disponibilidad se actualiza de forma manual.</p><label className="catalog-check-card"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/><span>Mostrar en el catálogo<small>Desmarca para ocultarlo sin eliminar su información.</small></span></label>
    <div className="member-actions"><Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar'}</Button></div></fieldset></form>
  </MemberDialog>;
}
