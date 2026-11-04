import React,{useEffect,useState} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCatalogImage } from '../../api/catalogApi';
export default function CatalogImage({item,photo,large=false,className=''}) {
  const {token}=useAuth();const selected=photo || item?.images?.[0];
  const [url,setUrl]=useState(''),[failed,setFailed]=useState(false);
  useEffect(()=>{
    if (!selected?.id || selected.file || selected.url) return;
    let active=true,objectUrl='';setUrl('');setFailed(false);
    getCatalogImage(item.id,selected.id,token,!large).then(blob=>{
      objectUrl=URL.createObjectURL(blob);
      if(active)setUrl(objectUrl);else URL.revokeObjectURL(objectUrl);
    }).catch(()=>active&&setFailed(true));
    return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[item?.id,selected?.id,selected?.url,token,large]);
  const src=selected?.url || url;
  return <div className={`catalog-image ${large?'catalog-image-large':''} ${className}`}>
    {src?<img src={src} alt={item?.name ? `${item.name}: ${selected?.filename||'imagen principal'}` : selected?.filename||'Imagen del suplemento'}/>:<div className="catalog-image-placeholder"><svg viewBox="0 0 48 48" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="7" width="38" height="34" rx="6"/><circle cx="17" cy="18" r="4"/><path d="m6 34 11-9 8 7 8-13 10 15"/></svg><span>{failed?'Imagen no disponible':selected?'Cargando imagen…':'Sin imagen'}</span></div>}
  </div>;
}
