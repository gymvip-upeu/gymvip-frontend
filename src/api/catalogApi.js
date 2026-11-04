import { httpClient } from './httpClient';
const base = '/api/v1/catalog';
async function request(path, token, options = {}) {
  const response = await httpClient(base + path, options, token);
  let data;
  try { data = await response.json(); }
  catch { throw new Error('El servidor devolvió una respuesta incompleta. Consulta el catálogo antes de volver a guardar.'); }
  if (!response.ok) {
    const error = new Error(data.message || 'No se pudo completar la operación.');
    error.status = response.status;
    throw error;
  }
  return data;
}
const queryString = values => new URLSearchParams(Object.entries(values).filter(([,v]) => v !== '' && v != null)).toString();
export const listSupplements = (filters, token) => request(`/supplements?${queryString(filters)}`, token);
export const getSupplement = (id, token) => request(`/supplements/${id}`, token);
export const supplementHistory = (id, page, token) => request(`/supplements/${id}/history?page=${page}`, token);
export async function updateSupplementState(item,data,token) {
  const saved=await request(`/supplements/${item.id}/state`,token,{method:'PATCH',body:JSON.stringify({...data,version:item.version})});
  if(saved.id!==item.id || !Number.isInteger(saved.version)) throw new Error('No se pudo confirmar el estado. Recarga el suplemento antes de reintentar.');
  return saved;
}
export async function saveSupplement(item, data, photos, token) {
  const body = new FormData();
  const uploads = photos.filter(p => p.file);
  const main = photos[0];
  body.append('data', new Blob([JSON.stringify({ ...data, pricePen:Number(data.pricePen),
    version:item?.version ?? null, keepImageIds:photos.filter(p => !p.file).map(p => p.id),
    primaryImageKey:main?.file ? `upload:${uploads.indexOf(main)}` : main?.id,
  })], {type:'application/json'}));
  uploads.forEach(p => body.append('images', p.file));
  const saved = await request(item ? `/supplements/${item.id}` : '/supplements', token, {method:item ? 'PUT':'POST',body});
  if (!saved.id || !Number.isInteger(saved.version) || !saved.images?.length) throw new Error('No se pudo confirmar el guardado completo. Revisa el catálogo antes de reintentar.');
  return saved;
}
export const listPromotions = (filters, token) => request(`/promotions?${queryString(filters)}`, token);
export const getPromotion = (id, token) => request(`/promotions/${id}`, token);
export const promotionHistory = (id, page, token) => request(`/promotions/${id}/history?page=${page}`, token);
export async function savePromotion(item, data, token) {
  const saved = await request(item ? `/promotions/${item.id}` : '/promotions', token, {
    method:item ? 'PUT':'POST', body:JSON.stringify({...data,offerPricePen:Number(data.offerPricePen),version:item?.version ?? null}),
  });
  if (!saved.id || !Number.isInteger(saved.version)) throw new Error('No se pudo confirmar el guardado. Revisa la lista antes de repetir la operación.');
  return saved;
}
export async function getCatalogImage(productId, imageId, token, thumbnail=true) {
  const response = await httpClient(`${base}/supplements/${productId}/images/${imageId}?thumbnail=${thumbnail}`,{},token);
  if (!response.ok) throw new Error('No se pudo cargar la imagen.');
  return response.blob();
}

export async function deactivatePromotion(item,token) {
  const saved=await request(`/promotions/${item.id}/deactivate`,token,{method:'POST',body:JSON.stringify({version:item.version})});
  if(saved.id!==item.id || saved.enabled!==false || !Number.isInteger(saved.version)) throw new Error('No se pudo confirmar la desactivación. Recarga la promoción antes de reintentar.');
  return saved;
}
