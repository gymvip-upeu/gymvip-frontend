import { httpClient } from './httpClient.js';

async function parse(response) {
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'No se pudo completar la operación de incidencia.');
  return response.json();
}

export async function listIncidentsApi(status, token) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return parse(await httpClient(`/api/v1/incidents${query}`, {}, token));
}

export async function createIncidentApi(title, description, token) {
  return parse(await httpClient('/api/v1/incidents', {
    method: 'POST', body: JSON.stringify({ title, description }),
  }, token));
}

export async function closeIncidentApi(id, reason, token) {
  return parse(await httpClient(`/api/v1/incidents/${encodeURIComponent(id)}/close`, {
    method: 'PATCH', body: JSON.stringify({ reason }),
  }, token));
}
