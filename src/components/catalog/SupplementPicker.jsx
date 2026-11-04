import React,{useEffect,useState} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listSupplements } from '../../api/catalogApi';
import MemberDialog from '../members/MemberDialog';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import CatalogImage from './CatalogImage';
import { availabilityLabel,presentationLabel } from './catalogUtils';
import { formatCurrencyPen } from '../../utils/formatters';
export default function SupplementPicker({selected,onSelect,onClose}) {
  const {token}=useAuth();const [query,setQuery]=useState(''),[applied,setApplied]=useState(''),[page,setPage]=useState(0),[data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[choice,setChoice]=useState(selected),[reload,setReload]=useState(0);
  useEffect(()=>{let active=true;setLoading(true);setError('');setData(null);listSupplements({query:applied,page,size:8},token).then(value=>active&&setData(value)).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false;};},[token,applied,page,reload]);
  return <MemberDialog title="Seleccionar suplemento" subtitle="Elige un producto registrado del catálogo." onClose={onClose} wide>
    <form className="catalog-picker-search" onSubmit={e=>{e.preventDefault();setApplied(query);setPage(0);}}><label>Buscar suplemento<input className="form-input" value={query} placeholder="Nombre o marca" onChange={e=>setQuery(e.target.value)}/></label><Button type="submit" variant="secondary">Buscar</Button></form>
    {error&&<><Alert variant="danger" message={error}/><Button variant="secondary" onClick={()=>setReload(n=>n+1)}>Reintentar</Button></>}
    <div className="catalog-picker-list">{loading?<p role="status">Cargando suplementos…</p>:!data?.content.length?<p>No hay suplementos para esta búsqueda.</p>:data.content.map(item=><label key={item.id} className={choice?.id===item.id?'selected':''}><input type="radio" name="promotion-supplement" checked={choice?.id===item.id} onChange={()=>setChoice(item)}/><CatalogImage item={item}/><span><strong>{item.name}</strong><small>{presentationLabel(item)}</small><small>{availabilityLabel(item.availability)} · {item.published?'Visible':'Oculto'} · Precio actual {formatCurrencyPen(item.pricePen)}</small></span></label>)}</div>
    {data&&data.totalPages>1&&<div className="catalog-pagination"><Button variant="secondary" disabled={loading||page===0} onClick={()=>setPage(n=>n-1)}>Anterior</Button><span>{page+1} / {data.totalPages}</span><Button variant="secondary" disabled={loading||page+1>=data.totalPages} onClick={()=>setPage(n=>n+1)}>Siguiente</Button></div>}
    <div className="member-actions"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={!choice} onClick={()=>onSelect(choice)}>Seleccionar</Button></div>
  </MemberDialog>;
}
