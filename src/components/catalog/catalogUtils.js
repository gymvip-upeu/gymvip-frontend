export const categories = [ ['PROTEINA','Proteína'], ['CREATINA','Creatina'], ['PREENTRENO','Preentreno'], ['AMINOACIDOS','Aminoácidos'], ['VITAMINAS','Vitaminas'], ['OTROS','Otros'] ];
export const categoryLabel = key => categories.find(([value]) => value === key)?.[1] || key;
export const availabilityLabel = key => key === 'DISPONIBLE' ? 'Disponible' : 'Agotado';
export const promotionStateLabel = key => ({VIGENTE:'Vigente',PROGRAMADA:'Programada',FINALIZADA:'Finalizada',CANCELADA:'Desactivada'}[key] || key);
export const presentationLabel = item => [item.flavor,item.netContent,item.presentation].filter(Boolean).join(' · ');
export const dateLabel = value => value ? new Date(`${value.slice(0,10)}T12:00:00Z`).toLocaleDateString('es-PE',{timeZone:'America/Lima'}) : '—';
export const updatedLabel = value => value ? new Date(value+'Z').toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'medium',timeStyle:'short'}) : '—';
export function validateSupplement(data, photos) {
  const errors = {};
  const labels = {name:'el nombre del suplemento',brand:'la marca',category:'la categoría',presentation:'la presentación',netContent:'el contenido neto',description:'la descripción y características'};
  Object.entries(labels).forEach(([key,label]) => { if (!data[key]?.trim()) errors[key] = `Completa ${label}.`; });
  if (!Number.isFinite(Number(data.pricePen)) || Number(data.pricePen)<=0 || !/^\d+(?:\.\d{1,2})?$/.test(String(data.pricePen))) errors.pricePen='El precio debe ser mayor que cero y tener como máximo dos decimales.';
  if (!photos.length || photos.length>5) errors.images='Adjunta entre 1 y 5 imágenes JPG o PNG.';
  return errors;
}
export function validatePromotion(data, reference) {
  const errors = {};
  for (const [key,label] of [['name','el nombre de la promoción'],['supplementId','un suplemento'],['description','la descripción'],['conditions','las condiciones']]) {
    if (!data[key]?.trim()) errors[key]=`Completa ${label}.`;
  }
  if (!Number.isFinite(Number(data.offerPricePen)) || Number(data.offerPricePen)<=0 || Number(data.offerPricePen)>=Number(reference) || !/^\d+(?:\.\d{1,2})?$/.test(String(data.offerPricePen))) errors.offerPricePen='La oferta debe ser positiva, menor al precio de referencia y tener hasta dos decimales.';
  if (!data.startDate) errors.startDate='Selecciona el inicio de vigencia.';
  if (!data.endDate || data.endDate<=data.startDate) errors.endDate='El fin debe ser posterior al inicio.';
  return errors;
}
