// ==============================================================================
// GYM VIP — API de Monitoreo y Estado de Comunicaciones (HU-18)
// ==============================================================================

import { httpClient } from './httpClient';

export async function getCommunicationsApi({ status = '', channel = '', search = '', page = 0, size = 20, signal } = {}, token = null) {
  const params = new URLSearchParams();
  if (status && status !== 'TODOS') params.append('status', status);
  if (channel && channel !== 'TODOS') params.append('channel', channel);
  if (search && search.trim()) params.append('search', search.trim());
  params.append('page', page);
  params.append('size', size);

  const url = `/api/v1/communications?${params.toString()}`;
  const response = await httpClient(url, { signal }, token);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al consultar el registro de comunicaciones.');
  }

  return response.json();
}

export async function retryCommunicationApi(id, token = null) {
  const response = await httpClient(`/api/v1/communications/${encodeURIComponent(id)}/retry`, {
    method: 'POST',
  }, token);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const error = new Error(err.message || 'Error al solicitar el reintento de comunicación.');
    error.status = response.status;
    throw error;
  }

  return response.json();
}
