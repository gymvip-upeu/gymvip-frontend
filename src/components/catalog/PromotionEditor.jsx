import React,{useRef,useState} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { savePromotion } from '../../api/catalogApi';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import MemberDialog from '../members/MemberDialog';
import SupplementPicker from './SupplementPicker';
import CatalogImage from './CatalogImage';
import { dateLabel,presentationLabel,validatePromotion } from './catalogUtils';
import { formatCurrencyPen } from '../../utils/formatters';
export default function PromotionEditor({item,onClose,onSaved}) {
  const {token}=useAuth();const [selected,setSelected]=useState(item?.supplement||null),[picker,setPicker]=useState(false),[form,setForm]=useState({supplementId:item?.supplement.id||'',name:item?.name||'',description:item?.description||'',conditions:item?.conditions||'',offerPricePen:item?Number(item.supplement.pricePen)-Number(item.savingsPen):'',startDate:item?.startDate||'',endDate:item?.endDate||'',enabled:item?.enabled??true}),[errors,setErrors]=useState({}),[error,setError]=useState(''),[review,setReview]=useState(false),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false);const saving=useRef(false);
  const reference=selected?.pricePen;
  const field=key=>({value:form[key],onChange:e=>{const value=e.target.value;setForm(v=>({...v,[key]:value}));setErrors(v=>({...v,[key]:''}));},onInput:e=>{if(key==='startDate'||key==='endDate'){const value=e.target.value;setForm(v=>({...v,[key]:value}));setErrors(v=>({...v,[key]:''}));}},'aria-invalid':!!errors[key],'aria-describedby':errors[key]?`promotion-${key}-error`:undefined});
  const feedback=key=>errors[key]&&<span className="catalog-field-error" id={`promotion-${key}-error`}>{errors[key]}</span>;
  function preview(e){e.preventDefault();const invalid=validatePromotion(form,reference);setErrors(invalid);if(Object.keys(invalid).length){setError('Revisa los campos señalados antes de continuar.');return;}setError('');setConfirmed(false);setReview(true);}
  async function save(){if(saving.current||!confirmed)return;saving.current=true;setBusy(true);setError('');try{onSaved(await savePromotion(item,{...form,reviewed:true,supplementVersion:selected.version},token));}catch(e){setError(e.message);}finally{setBusy(false);saving.current=false;}}
  return <section className="catalog-page catalog-editor">
    <div className="catalog-page-heading"><div><div className="catalog-eyebrow">PROMOCIONES / {item?'EDICIÓN':'REGISTRO'}</div><h1>{item?'Editar promoción':'Nueva promoción'}</h1><p>Define el producto, el precio de oferta y sus condiciones.</p></div></div>
    {error&&!review&&<Alert variant="danger" message={error}/>}<form noValidate onSubmit={preview}>
      <div className="catalog-editor-grid"><div className="catalog-panel catalog-form-panel">
        <label>Nombre de la promoción <span>*</span><input className="form-input" maxLength={160} placeholder="Ej. Oferta de noviembre" {...field('name')}/>{feedback('name')}</label>
        <label>Suplemento <span>*</span><button type="button" className={`catalog-select-button ${errors.supplementId?'invalid':''}`} aria-label="Elegir suplemento para la promoción" onClick={()=>setPicker(true)}>{selected?`${selected.name} · ${presentationLabel(selected)}`:'Seleccionar suplemento'}<span>⌄</span></button>{feedback('supplementId')}</label>
        <div className="catalog-form-grid"><label>Precio de oferta (S/) <span>*</span><input className="form-input" type="number" min="0.01" step="0.01" placeholder="135.00" {...field('offerPricePen')}/>{feedback('offerPricePen')}</label><label>Precio de referencia<input className="form-input" readOnly aria-label="Precio de referencia de la promoción" value={reference==null?'':Number(reference).toFixed(2)} placeholder="Según suplemento"/></label></div>
        {item&&<p className="catalog-help">Descuento registrado: {formatCurrencyPen(item.savingsPen)}. La oferta se calcula sobre el precio actual del suplemento. Cambiar el importe de oferta cambiará ese descuento al guardar.</p>}
        <div className="catalog-form-grid"><label>Inicio de vigencia <span>*</span><input className="form-input" type="date" {...field('startDate')}/>{feedback('startDate')}</label><label>Fin de vigencia <span>*</span><input className="form-input" type="date" {...field('endDate')}/>{feedback('endDate')}</label></div>
        <p className="catalog-help">Vigencia por fechas de Perú (Lima). La oferta finaliza al terminar el día indicado.</p>
        <label>Descripción <span>*</span><textarea className="form-input" rows={2} maxLength={2000} placeholder="Describe la oferta comercial…" {...field('description')}/>{feedback('description')}</label>
        <label>Condiciones <span>*</span><textarea className="form-input" rows={3} maxLength={2000} placeholder="Presentación aplicable, restricciones y condiciones…" {...field('conditions')}/>{feedback('conditions')}</label>
        <label className="catalog-check-card"><input type="checkbox" checked={form.enabled} onChange={e=>setForm(v=>({...v,enabled:e.target.checked}))}/><span>Habilitar promoción según sus fechas<small>Puede desactivarse antes del vencimiento sin borrar su historial.</small></span></label>
      </div><aside className="catalog-editor-aside">
        {selected&&<div className="catalog-panel catalog-promotion-product"><CatalogImage item={selected}/><h3>{selected.name}</h3><p>{presentationLabel(selected)}</p></div>}
        <div className="catalog-note"><strong>Precio claro para el cliente</strong><p>Se mostrarán el precio de referencia, el precio de oferta y el ahorro.</p></div><div className="catalog-note"><strong>Vigencia automática</strong><p>Solo las promociones habilitadas y dentro de sus fechas se consideran vigentes.</p></div><div className="catalog-note catalog-note-quiet"><strong>Beneficio conservado</strong><p>El descuento queda fijo. Si cambia el precio habitual, el precio de oferta se recalcula conservando el mismo ahorro.</p></div>
      </aside></div>
      <div className="catalog-editor-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">{item?'Revisar cambios':'Revisar promoción'}</Button></div>
    </form>
    {picker&&<SupplementPicker selected={selected} onClose={()=>setPicker(false)} onSelect={value=>{setSelected(value);setForm(v=>({...v,supplementId:value.id}));setErrors(v=>({...v,supplementId:''}));setPicker(false);}}/>}
    {review&&<MemberDialog title="Revisar promoción" subtitle="Confirma el beneficio, las fechas y las condiciones." onClose={()=>setReview(false)} busy={busy} wide>
      {error&&<Alert variant="danger" message={error}/>}<div className="catalog-review-product"><CatalogImage item={selected}/><div><h3>{selected.name} · {form.name}</h3><div className="catalog-promo-prices"><strong className="catalog-price">{formatCurrencyPen(Number(form.offerPricePen))}</strong><span>Antes {formatCurrencyPen(Number(reference))}</span></div><p>Ahorras {formatCurrencyPen(Number(reference)-Number(form.offerPricePen))}</p><p>{dateLabel(form.startDate)} — {dateLabel(form.endDate)}</p></div></div><p className="catalog-review-copy">{form.description}</p><p className="catalog-review-copy">{form.conditions}</p><p className="catalog-help">{form.enabled?'Se habilitará únicamente durante sus fechas.':'Quedará desactivada.'}</p><label className="catalog-check-card"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/><span>Confirmo las fechas, el precio y las condiciones de la promoción.</span></label><div className="member-actions"><Button variant="secondary" disabled={busy} onClick={()=>setReview(false)}>Volver a editar</Button><Button disabled={busy||!confirmed} onClick={save}>{busy?'Guardando…':item?'Guardar cambios':'Registrar promoción'}</Button></div>
    </MemberDialog>}
  </section>;
}

