import React,{useEffect,useState} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClients } from '../hooks/useClients';
import { memberOverview } from '../api/memberApi';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import ClientRegisterModal from '../components/modals/ClientRegisterModal';
import MemberEditor from '../components/members/MemberEditor';
import MemberSale from '../components/members/MemberSale';
import MemberCredentials from '../components/members/MemberCredentials';
import MemberConfirmation from '../components/members/MemberConfirmation';
import MemberProfilePage from './MemberProfilePage';
import { dateLabel,stateLabel } from '../components/members/memberUtils';

function ActionIcon({name}) {
  const paths={view:<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,plan:<><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16m-8 3v4m-2-2h4"/></>,edit:<><path d="m16 3 5 5-12 12-6 1 1-6L16 3Z"/><path d="m13 6 5 5"/></>,power:<><path d="M12 2v9M6.3 5a9 9 0 1 0 11.4 0"/></>};
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export default function ClientsPage(){
  const {token,isAdmin}=useAuth();const {clients,page,totalPages,totalElements,searchQuery,setSearchQuery,loading,error,successToast,setSuccessToast,loadClients,handleSearchSubmit,handleClearSearch}=useClients(token);
  const [overview,setOverview]=useState({}),[overviewError,setOverviewError]=useState(''),[selected,setSelected]=useState(null),[action,setAction]=useState(null),[credentials,setCredentials]=useState(null);
  useEffect(()=>{let active=true;setOverview({});setOverviewError('');if(clients.length)memberOverview(clients.map(c=>c.id),token).then(v=>active&&setOverview(v)).catch(e=>active&&setOverviewError(e.message));return()=>{active=false;};},[clients,token]);
  const changed=message=>{setAction(null);setSuccessToast(message);loadClients(searchQuery,page);};
  if(selected)return <MemberProfilePage clientId={selected} onBack={()=>{setSelected(null);loadClients(searchQuery,page);}} onChanged={()=>loadClients(searchQuery,page)}/>;
  return <section className="members-page" aria-labelledby="members-title"><div className="members-heading"><div><h1 id="members-title">Miembros</h1><p>{loading?'Cargando miembros…':`${totalElements} ${totalElements===1?'miembro registrado':'miembros registrados'}`}</p></div><Button onClick={()=>setAction({kind:'register'})}>＋ Nuevo miembro</Button></div>
    {successToast&&<Alert variant="success" message={successToast} onClose={()=>setSuccessToast(null)}/>}{error&&<Alert variant="danger" message={error}/>}{overviewError&&<Alert variant="danger" message={`No se pudieron verificar las membresías: ${overviewError}`}/>}
    <form className="member-search-form" onSubmit={handleSearchSubmit}><label htmlFor="members-search">Buscar miembros</label><div><input id="members-search" className="form-input" placeholder="Buscar por nombre, email, teléfono, DNI o código…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/><Button type="submit" variant="secondary" disabled={loading}>Buscar</Button>{searchQuery&&<button type="button" className="member-text-action" onClick={handleClearSearch}>Limpiar</button>}</div></form>
    <div className="member-panel member-list-panel"><div className="member-table-wrap"><table className="member-table"><thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Documento</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{loading?<tr><td colSpan={7} className="member-empty" role="status">Cargando miembros…</td></tr>:error?<tr><td colSpan={7} className="member-empty"><p>No se pudo cargar el listado.</p><Button variant="secondary" onClick={()=>loadClients(searchQuery,page)}>Reintentar</Button></td></tr>:clients.map(c=>{const v=overview[c.id];return <tr key={c.id}><td><button className="member-name-link" onClick={()=>setSelected(c.id)}>{c.firstName} {c.lastName}</button><small>{c.memberCode}</small></td><td>{c.email||'—'}</td><td>{c.phone||'—'}</td><td>{c.documents?.find(d=>d.isPrimary)?.documentNumber||c.documents?.[0]?.documentNumber||'—'}</td><td>{v?v.planName||'Sin plan':overviewError?'Sin verificar':'Consultando…'}</td><td><span className={`member-status ${c.status==='INACTIVO'?'status-inactivo':`state-${v?.state?.toLowerCase()||'unknown'}`}`}>{c.status==='INACTIVO'?'Inactivo':v?stateLabel(v.state):'Sin verificar'}</span>{v?.lastIncludedDate&&<small>Vence: {dateLabel(v.lastIncludedDate)}</small>}</td><td><div className="member-row-actions"><button title="Ver información" aria-label={`Ver información de ${c.fullName}`} onClick={()=>setSelected(c.id)}><ActionIcon name="view"/></button><button disabled={c.status!=='ACTIVO'} title="Asignar o renovar plan" aria-label={`Asignar o renovar plan de ${c.fullName}`} onClick={()=>setAction({kind:'sale',client:c})}><ActionIcon name="plan"/></button><button title="Editar miembro" aria-label={`Editar a ${c.fullName}`} onClick={()=>setAction({kind:'edit',client:c})}><ActionIcon name="edit"/></button>{isAdmin()&&<button className={c.status==='ACTIVO'?'member-danger':'member-positive'} title={c.status==='ACTIVO'?'Desactivar miembro':'Activar miembro'} aria-label={`${c.status==='ACTIVO'?'Desactivar':'Activar'} a ${c.fullName}`} onClick={()=>setAction({kind:'status',client:c})}><ActionIcon name="power"/></button>}</div></td></tr>;})}{!loading&&!error&&!clients.length&&<tr><td colSpan={7} className="member-empty"><strong>No encontramos miembros</strong><p>{searchQuery?'Prueba con otro nombre o documento.':'Registra un miembro para empezar.'}</p></td></tr>}</tbody></table></div></div>
    <div className="member-pagination"><span>Página {page+1} de {Math.max(totalPages,1)}</span><div><Button variant="secondary" disabled={loading||page===0} onClick={()=>loadClients(searchQuery,page-1)}>Anterior</Button><Button variant="secondary" disabled={loading||page+1>=totalPages} onClick={()=>loadClients(searchQuery,page+1)}>Siguiente</Button></div></div>
    {action?.kind==='register'&&<ClientRegisterModal token={token} onClose={()=>setAction(null)} onSuccess={(c,access)=>{changed(`Miembro ${c.fullName||c.firstName} registrado correctamente.`);if(access)setCredentials(access);}}/>}
    {action?.kind==='edit'&&<MemberEditor client={action.client} token={token} onClose={()=>setAction(null)} onSaved={()=>changed('Datos actualizados correctamente.')}/>}
    {action?.kind==='sale'&&<MemberSale client={action.client} onClose={()=>setAction(null)} onSaved={()=>changed('Pago registrado y membresía actualizada.')}/>}
    {action?.kind==='status'&&<MemberConfirmation client={action.client} token={token} onClose={()=>setAction(null)} onSaved={()=>changed('Estado del miembro actualizado.')}/>}
    {credentials&&<MemberCredentials credentials={credentials} onClose={()=>setCredentials(null)}/>}
  </section>;
}
