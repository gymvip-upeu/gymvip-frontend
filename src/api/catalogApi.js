import { httpClient } from './httpClient';
const base = '/api/v1/catalog';
async function request(path, token, options = {}) {
  const response = await httpClient(base + path, options, token);
  let data;
  try { data = await response.json(); }
  catch { throw new Error('El servidor devolvió una respuesta incompleta. Consulta el catálogo antes de volver a guardar.'); }
  if (!response.ok) {
    const error = new Error(data?.message || 'No se pudo completar la operación.');
    error.status = response.status;
    throw error;
  }
  return data;
}
const queryString = values => new URLSearchParams(Object.entries(values).filter(([,v]) => v !== '' && v != null)).toString();
const isSupplement = item => !!item && typeof item.id === 'string' && Number.isInteger(item.version) && Array.isArray(item.images) && typeof item.name === 'string';
const isPromotion = item => !!item && typeof item.id === 'string' && Number.isInteger(item.version) && isSupplement(item.supplement) && ['VIGENTE','PROGRAMADA','FINALIZADA','CANCELADA'].includes(item.state);
const isStoreProduct = item => !!item && typeof item.id === 'string' && typeof item.name === 'string' &&
  Number.isFinite(Number(item.pricePen)) && typeof item.availability === 'string' &&
  (!item.offer || (typeof item.offer.id === 'string' && Number.isFinite(Number(item.offer.pricePen))));
function confirmedItem(item, valid, id) {
  if (!valid(item) || (id && item.id !== id)) throw new Error('El servidor devolvió datos incompletos o de otro registro. Recarga antes de continuar.');
  return item;
}
function confirmedPage(data, valid) {
  if (!data || !Array.isArray(data.content) || !data.content.every(valid) || !Number.isInteger(data.totalElements) || data.totalElements < 0 || !Number.isInteger(data.totalPages) || data.totalPages < 0) throw new Error('No se pudo confirmar la lista del catálogo. Reintenta la consulta.');
  return data;
}
export const listSupplements = async (filters, token) => confirmedPage(await request(`/supplements?${queryString(filters)}`, token), isSupplement);
export async function listCatalogProducts(token, pageSize = 60) {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 60) throw new Error('El tamaño de página del catálogo no es válido.');
  const products = new Map();
  for (let page = 0; page < 100; page += 1) {
    const rows = await request(`/products?page=${page}&size=${pageSize}`, token);
    if (!Array.isArray(rows) || !rows.every(isStoreProduct)) {
      throw new Error('El servidor devolvió un catálogo comercial incompleto. Reintenta la consulta.');
    }
    rows.forEach(item => products.set(item.id, item));
    if (rows.length < pageSize) return [...products.values()];
  }
  throw new Error('El catálogo excede el límite de páginas permitido.');
}
export const getSupplement = async (id, token) => confirmedItem(await request(`/supplements/${id}`, token), isSupplement, id);
function confirmedHistory(rows) {
  if (!Array.isArray(rows)) throw new Error('No se pudo confirmar el historial. Reintenta la consulta.');
  for (const row of rows) {
    let snapshot;
    try { snapshot=JSON.parse(row?.snapshot); } catch { throw new Error('El historial contiene un registro incompleto. Reintenta la consulta.'); }
    if (!snapshot || typeof snapshot.name!=='string' || !Number.isInteger(row.version)) throw new Error('El historial contiene un registro incompleto. Reintenta la consulta.');
  }
  return rows;
}
export const supplementHistory = async (id, page, token) => confirmedHistory(await request(`/supplements/${id}/history?page=${page}`, token));
export async function updateSupplementState(item,data,token) {
  const saved=await request(`/supplements/${item.id}/state`,token,{method:'PATCH',body:JSON.stringify({...data,version:item.version})});
  if(!isSupplement(saved) || saved.id!==item.id || saved.version<=item.version || saved.availability!==data.availability || saved.published!==data.published) throw new Error('No se pudo confirmar el estado. Recarga el suplemento antes de reintentar.');
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
  if (!isSupplement(saved) || !saved.images.length || (item && (saved.id!==item.id || saved.version<=item.version))) throw new Error('No se pudo confirmar el guardado completo. Revisa el catálogo antes de reintentar.');
  return saved;
}
export const listPromotions = async (filters, token) => confirmedPage(await request(`/promotions?${queryString(filters)}`, token), isPromotion);
export const getPromotion = async (id, token) => confirmedItem(await request(`/promotions/${id}`, token), isPromotion, id);
export const promotionHistory = async (id, page, token) => confirmedHistory(await request(`/promotions/${id}/history?page=${page}`, token));
export async function savePromotion(item, data, token) {
  const saved = await request(item ? `/promotions/${item.id}` : '/promotions', token, {
    method:item ? 'PUT':'POST', body:JSON.stringify({...data,offerPricePen:Number(data.offerPricePen),version:item?.version ?? null}),
  });
  if (!isPromotion(saved) || saved.supplement.id!==data.supplementId || (item && (saved.id!==item.id || saved.version<=item.version))) throw new Error('No se pudo confirmar el guardado. Revisa la lista antes de repetir la operación.');
  return saved;
}
export async function getCatalogImage(productId, imageId, token, thumbnail=true) {
  const response = await httpClient(`${base}/supplements/${productId}/images/${imageId}?thumbnail=${thumbnail}`,{},token);
  if (!response.ok) throw new Error('No se pudo cargar la imagen.');
  return response.blob();
}

export async function deactivatePromotion(item,token) {
  const saved=await request(`/promotions/${item.id}/deactivate`,token,{method:'POST',body:JSON.stringify({version:item.version})});
  if(!isPromotion(saved) || saved.id!==item.id || saved.enabled!==false || saved.version<=item.version) throw new Error('No se pudo confirmar la desactivación. Recarga la promoción antes de reintentar.');
  return saved;
}

