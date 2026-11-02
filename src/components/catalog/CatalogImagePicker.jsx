import React,{useRef,useState,useEffect} from 'react';
import MemberDialog from '../members/MemberDialog';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
export default function CatalogImagePicker({remaining,onAdd,onClose}) {
  const input=useRef(null),urls=useRef([]);const [photos,setPhotos]=useState([]),[error,setError]=useState('');
  useEffect(()=>()=>urls.current.forEach(URL.revokeObjectURL),[]);
  function select(files) {
    setError('');const selected=[...files];
    if(selected.length+photos.length>remaining){setError(`Puedes añadir ${remaining} imágenes más como máximo.`);return;}
    if(selected.some(f=>!['image/jpeg','image/png'].includes(f.type)||f.size>5*1024*1024||!f.size)){setError('Selecciona imágenes JPG o PNG de hasta 5 MB por archivo.');return;}
    setPhotos(previous=>[...previous,...selected.map(file=>{const url=URL.createObjectURL(file);urls.current.push(url);return {id:crypto.randomUUID(),filename:file.name,file,url};})]);
  }
  function confirm(){
    // The editor creates its own object URLs; picker previews are released on close.
    onAdd(photos.map(p=>({id:p.id,filename:p.filename,file:p.file})));
  }
  return <MemberDialog title="Imágenes del suplemento" subtitle="Añade fotografías legibles del envase y su rotulado." onClose={onClose} wide>
    {error&&<Alert variant="danger" message={error}/>}
    <div className="catalog-dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();select(e.dataTransfer.files);}}>
      <span className="catalog-upload-icon" aria-hidden="true">↑</span><h3>Arrastra tus imágenes aquí</h3><p>o selecciona archivos de tu equipo</p>
      <Button onClick={()=>input.current.click()}>Seleccionar archivos</Button><input ref={input} className="catalog-hidden-file" type="file" accept="image/jpeg,image/png" multiple onChange={e=>{select(e.target.files);e.target.value='';}}/>
    </div>
    <p className="catalog-help">Frontal · Ingredientes · Información nutricional<br/>JPG y PNG. Hasta 5 MB por imagen; máximo 5 imágenes por producto.</p>
    <div className="catalog-upload-previews">{photos.map(p=><div key={p.id}><img src={p.url} alt={p.filename}/><span>{p.filename}</span><button aria-label={`Quitar ${p.filename}`} onClick={()=>setPhotos(v=>v.filter(x=>x.id!==p.id))}>×</button></div>)}</div>
    <div className="member-actions"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={!photos.length} onClick={confirm}>Añadir {photos.length?`(${photos.length})`:''}</Button></div>
  </MemberDialog>;
}
