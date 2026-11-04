import React,{useEffect,useRef,useState} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { saveSupplement } from '../../api/catalogApi';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import MemberDialog from '../members/MemberDialog';
import CatalogImage from './CatalogImage';
import CatalogImagePicker from './CatalogImagePicker';
import { categories,categoryLabel,availabilityLabel,presentationLabel,validateSupplement } from './catalogUtils';
import { formatCurrencyPen } from '../../utils/formatters';

export default function SupplementEditor({item,onClose,onSaved}) {
  const {token}=useAuth();
  const [form,setForm]=useState({name:item?.name||'',brand:item?.brand||'',category:item?.category||'',presentation:item?.presentation||'',netContent:item?.netContent||'',flavor:item?.flavor||'',description:item?.description||'',ingredients:item?.ingredients||'',pricePen:item?.pricePen??'',availability:item?.availability||'DISPONIBLE',published:item?.published??true});
  const [photos,setPhotos]=useState(item?.images||[]),[tab,setTab]=useState('information'),[picker,setPicker]=useState(false),[review,setReview]=useState(false),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[errors,setErrors]=useState({});
  const urls=useRef([]),saving=useRef(false);
  useEffect(()=>()=>urls.current.forEach(URL.revokeObjectURL),[]);
  const field=key=>({id:`supplement-${key}`,value:form[key],onChange:e=>{setForm(v=>({...v,[key]:e.target.value}));setErrors(v=>({...v,[key]:''}));},'aria-invalid':!!errors[key],'aria-describedby':errors[key]?`supplement-${key}-error`:undefined});
  const feedback=key=>errors[key]&&<span className="catalog-field-error" id={`supplement-${key}-error`}>{errors[key]}</span>;
  function preview(e){e.preventDefault();const invalid=validateSupplement(form,photos);setErrors(invalid);if(Object.keys(invalid).length){setTab(invalid.images&&Object.keys(invalid).length===1?'images':'information');setError('Revisa los campos señalados antes de continuar.');return;}setConfirmed(false);setError('');setReview(true);}
  async function save(){if(saving.current||!confirmed)return;saving.current=true;setBusy(true);setError('');try{onSaved(await saveSupplement(item,{...form,reviewed:true},photos,token));}catch(e){setError(e.message);}finally{setBusy(false);saving.current=false;}}
  function addPhotos(values){setPhotos(previous=>[...previous,...values.map(p=>{const url=URL.createObjectURL(p.file);urls.current.push(url);return {...p,url};})]);setPicker(false);setErrors(v=>({...v,images:''}));}
  return <section className="catalog-page catalog-editor">
    <div className="catalog-page-heading"><div><div className="catalog-eyebrow">CATÁLOGO / {item?'EDICIÓN':'REGISTRO'}</div><h1>{item?'Editar suplemento':'Nuevo suplemento'}</h1><p>Información del producto según su rotulado.</p></div></div>
    {error&&!review&&!picker&&<Alert variant="danger" message={error}/>}
    <div className="catalog-tabs" role="tablist" aria-label="Datos del suplemento">{[['information','Información'],['images','Imágenes'],['availability','Disponibilidad']].map(([key,label])=><button key={key} type="button" role="tab" aria-selected={tab===key} aria-controls={`supplement-panel-${key}`} id={`supplement-tab-${key}`} className={tab===key?'active':''} onClick={()=>setTab(key)}>{label}</button>)}</div>
    <form noValidate onSubmit={preview}>
      <div className="catalog-editor-grid"><div className="catalog-panel catalog-form-panel">
        <section role="tabpanel" id="supplement-panel-information" aria-labelledby="supplement-tab-information" hidden={tab!=='information'}>
          <div className="catalog-form-grid"><label>Nombre del suplemento <span>*</span><input className="form-input" maxLength={120} placeholder="Ej. Whey Protein" {...field('name')}/>{feedback('name')}</label><label>Marca <span>*</span><input className="form-input" maxLength={120} placeholder="Marca del envase" {...field('brand')}/>{feedback('brand')}</label>
          <label>Categoría <span>*</span><select className="form-input" {...field('category')}><option value="">Seleccionar</option>{categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>{feedback('category')}</label><label>Precio (S/) <span>*</span><input className="form-input" type="number" min="0.01" step="0.01" placeholder="150.00" {...field('pricePen')}/>{feedback('pricePen')}</label>
          <label>Presentación <span>*</span><input className="form-input" maxLength={120} placeholder="Ej. Pote" {...field('presentation')}/>{feedback('presentation')}</label><label>Contenido neto <span>*</span><input className="form-input" maxLength={100} placeholder="Ej. 900 g" {...field('netContent')}/>{feedback('netContent')}</label>
          <label className="catalog-full-field">Sabor <small>(opcional)</small><input className="form-input" maxLength={100} placeholder="Ej. Vainilla" {...field('flavor')}/></label></div>
          <label>Descripción y características <span>*</span><textarea className="form-input" rows={3} maxLength={4000} placeholder="Información verificable del producto según su envase…" {...field('description')}/>{feedback('description')}</label>
          <label>Ingredientes y alérgenos <small>(opcional)</small><textarea className="form-input" rows={2} maxLength={2000} placeholder="Transcribe la información del rotulado…" {...field('ingredients')}/></label>
        </section>
        <section role="tabpanel" id="supplement-panel-images" aria-labelledby="supplement-tab-images" hidden={tab!=='images'}>
          <h2>Imágenes del producto</h2><p className="catalog-help">La primera imagen será la principal del catálogo. Añade fotografías del frente, ingredientes o información nutricional.</p>{feedback('images')}
          <div className="catalog-photo-grid">{photos.map((photo,index)=><article key={photo.id}><CatalogImage item={{...form,id:item?.id}} photo={photo}/><span className="catalog-photo-name" title={photo.filename}>{photo.filename}</span><div>{index===0?<span className="catalog-tag">Principal</span>:<button type="button" className="catalog-text-button" onClick={()=>setPhotos(values=>[photo,...values.filter(p=>p.id!==photo.id)])}>Hacer principal</button>}<button type="button" className="catalog-text-button catalog-danger" onClick={()=>setPhotos(values=>values.filter(p=>p.id!==photo.id))} aria-label={`Quitar ${photo.filename}`}>Quitar</button></div></article>)}</div>
          <Button type="button" variant="secondary" disabled={photos.length>=5} onClick={()=>setPicker(true)}>＋ Añadir imágenes</Button><p className="catalog-help">{photos.length} de 5 imágenes · JPG o PNG · máximo 5 MB cada una.</p>
        </section>
        <section role="tabpanel" id="supplement-panel-availability" aria-labelledby="supplement-tab-availability" hidden={tab!=='availability'}>
          <h2>Disponibilidad y publicación</h2><p className="catalog-help">La disponibilidad se actualiza manualmente. Ocultar un producto conserva su información y su historial.</p>
          <label>Disponibilidad<select className="form-input" value={form.availability} onChange={e=>setForm(v=>({...v,availability:e.target.value}))}><option value="DISPONIBLE">Disponible</option><option value="AGOTADO">Agotado temporalmente</option></select></label>
          <label className="catalog-check-card"><input type="checkbox" checked={form.published} onChange={e=>setForm(v=>({...v,published:e.target.checked}))}/><span>Mostrar en el catálogo<small>{form.published?'El suplemento estará habilitado para consulta.':'El suplemento permanecerá oculto para los clientes.'}</small></span></label>
          <div className="catalog-note"><strong>Sin eliminación</strong><p>Podrás volver a publicar el suplemento cuando lo necesites.</p></div>
        </section>
      </div><aside className="catalog-editor-aside"><div className="catalog-panel catalog-cover-panel"><CatalogImage item={{...form,id:item?.id}} photo={photos[0]}/><h3>{photos[0]?.filename||'Imagen del suplemento'}</h3><p>JPG o PNG · máximo 5 MB</p><Button type="button" variant="secondary" onClick={()=>photos.length?setTab('images'):setPicker(true)}>{photos.length?'Administrar imágenes':'Subir imágenes'}</Button>{errors.images&&<span className="catalog-field-error">{errors.images}</span>}</div><div className="catalog-note"><strong>Revisa el rotulado</strong><p>No agregues propiedades que el envase no indique.</p></div><div className="catalog-note catalog-note-quiet"><strong>Precio por presentación</strong><p>Cada presentación o contenido neto con un precio distinto se registra como un producto separado.</p></div></aside></div>
      <div className="catalog-editor-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">{item?'Revisar cambios':'Revisar suplemento'}</Button></div>
    </form>
    {picker&&<CatalogImagePicker remaining={5-photos.length} onAdd={addPhotos} onClose={()=>setPicker(false)}/>}
    {review&&<MemberDialog title="Revisar suplemento" subtitle="Así se mostrará la información en el catálogo." onClose={()=>setReview(false)} busy={busy} wide>
      {error&&<Alert variant="danger" message={error}/>}<div className="catalog-review-product"><CatalogImage item={{...form,id:item?.id}} photo={photos[0]}/><div><span className="catalog-eyebrow">{categoryLabel(form.category)}</span><h3>{form.name}</h3><p>{form.brand} · {presentationLabel(form)}</p><strong className="catalog-price">{formatCurrencyPen(Number(form.pricePen))}</strong><span className={`catalog-status ${form.availability==='AGOTADO'?'is-unavailable':''}`}>{availabilityLabel(form.availability)}</span></div></div>
      <p className="catalog-review-copy">{form.description}</p>{form.ingredients&&<p className="catalog-help">Ingredientes y alérgenos: {form.ingredients}</p>}<p className="catalog-help">{photos.length} imágenes · {form.published?'Publicado para consulta':'Oculto del catálogo'}</p>
      <label className="catalog-check-card"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/><span>Confirmo que la información coincide con el envase.</span></label>
      <div className="member-actions"><Button variant="secondary" disabled={busy} onClick={()=>setReview(false)}>Volver a editar</Button><Button disabled={busy||!confirmed} onClick={save}>{busy?'Guardando…':item?'Guardar cambios':'Registrar suplemento'}</Button></div>
    </MemberDialog>}
  </section>;
}
