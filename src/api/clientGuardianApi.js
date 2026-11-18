// ==============================================================================
// GYM VIP — API de Apoderados y Consentimiento de Menores (Ley 29733)
// ==============================================================================

import { httpClient } from './httpClient.js';

export async function getClientGuardiansApi(clientId, token = null) {
  const response = await httpClient(`/api/v1/clients/${clientId}/guardians`, {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al consultar apoderados del socio.');
  }
  return response.json();
}

export async function registerGuardianApi(clientId, guardianData, token = null) {
  const response = await httpClient(`/api/v1/clients/${clientId}/guardians`, {
    method: 'POST',
    body: JSON.stringify(guardianData),
  }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al registrar apoderado.');
  }
  return response.json();
}

export async function deleteGuardianApi(clientId, guardianId, token = null) {
  const response = await httpClient(`/api/v1/clients/${clientId}/guardians/${guardianId}`, {
    method: 'DELETE',
  }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al eliminar apoderado.');
  }
  return true;
}
