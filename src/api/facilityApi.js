// ==============================================================================
// GYM VIP — API de Áreas, Instalaciones y Estado de Canales (HU-34)
// ==============================================================================

import { httpClient } from './httpClient.js';

async function request(path, token, options = {}) {
  const response = await httpClient(path, options, token);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.message || body?.error || 'Error al procesar solicitud de instalaciones');
    error.status = response.status;
    throw error;
  }
  return body;
}

export const getFacilitiesApi = (token, signal) => request('/api/v1/facilities', token, { signal });

export const createFacilityApi = (data, token) => request('/api/v1/facilities', token, {
  method: 'POST',
  body: JSON.stringify(data),
});

export const updateFacilityApi = (id, data, token) => request(`/api/v1/facilities/${encodeURIComponent(id)}`, token, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const updateFacilityStatusApi = (id, status, reason, notifyMembers, token) => request(`/api/v1/facilities/${encodeURIComponent(id)}/status`, token, {
  method: 'PATCH',
  body: JSON.stringify({ status, reason, notifyMembers }),
});

export const getChannelStatusApi = (token, signal) => request('/api/v1/channels/status', token, { signal });
