import { httpClient } from './httpClient';

async function request(path, token, options = {}) {
  const response = await httpClient(path, options, token);
  let body;
  try { body = await response.json(); }
  catch { throw new Error('Respuesta incompleta del servidor. No se pudo confirmar el resultado.'); }
  if (!response.ok) {
    const error = new Error(body.message || 'No se pudo completar la consulta. Intenta nuevamente.');
    error.status = response.status; error.details = body.details; throw error;
  }
  return body;
}
export async function updateClient(id, data, token) {
  const value = await request(`/api/v1/clients/${id}`, token, { method: 'PUT', body: JSON.stringify(data) });
  if (value.id !== id || !Number.isInteger(value.version)) throw new Error('No se pudo confirmar la actualización. Recarga la ficha antes de reintentar.');
  return value;
}
export const clientChanges = (id, page, token) => request(`/api/v1/clients/${id}/changes?page=${page}&size=20`, token);
export async function verifyCoverage(id, token) {
  const value = await request(`/api/v1/coverage/clients/${id}`, token);
  if (value.clientId !== id || typeof value.allowed !== 'boolean' || !value.state || !value.checkedAt || !value.timezone
    || (value.allowed && !['VIGENTE', 'POR_VENCER'].includes(value.state)))
    throw new Error('Respuesta de verificación inválida. No se puede confirmar el ingreso.');
  return value;
}
export function listCoverage(filters, token) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null));
  return request(`/api/v1/coverage?${params}`, token);
}
