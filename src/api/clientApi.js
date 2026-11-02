// ==============================================================================
// GYM VIP — API de Socios y Clientes (HU-01)
// ==============================================================================

import { httpClient } from './httpClient';

export async function searchClientsApi(query = '', page = 0, size = 20, token = null) {
  const queryParam = query ? `query=${encodeURIComponent(query)}&` : '';
  const url = `/api/v1/clients?${queryParam}page=${page}&size=${size}`;
  const response = await httpClient(url, {}, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al consultar la lista de socios.');
  }

  return response.json();
}

export async function getClientByIdApi(id, token = null) {
  const response = await httpClient(`/api/v1/clients/${id}`, {}, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Socio no encontrado.');
  }

  return response.json();
}

export async function registerClientApi(clientData, token = null) {
  const response = await httpClient('/api/v1/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  }, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const message = errJson.message || (response.status === 409 ? 'El documento ya se encuentra registrado con otro socio.' : 'Error al registrar el socio.');
    const error = new Error(message);
    error.status = response.status;
    error.details = errJson.details || null;
    throw error;
  }

  return response.json();
}
