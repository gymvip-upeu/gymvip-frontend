// ==============================================================================
// GYM VIP — API de Personal y Roles (HU-04)
// ==============================================================================

import { httpClient } from './httpClient';

export async function listAccountsApi(token = null) {
  const response = await httpClient('/api/v1/accounts', {}, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al obtener la nómina de personal.');
  }

  return response.json();
}

export async function createAccountApi(accountData, token = null) {
  const response = await httpClient('/api/v1/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  }, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al registrar la cuenta de personal.');
  }

  return response.json();
}

export async function updateAccountRoleApi(id, role, token = null) {
  const response = await httpClient(`/api/v1/accounts/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al actualizar el rol del trabajador.');
  }

  return response.json();
}

/**
 * Inactiva una cuenta de personal mediante el endpoint PATCH /api/v1/accounts/{id}/status.
 * @param {string} id UUID de la cuenta
 * @param {string|null} token
 */
export async function inactivateAccountApi(id, token = null) {
  const response = await httpClient(`/api/v1/accounts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'INACTIVO' }),
  }, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al inactivar la cuenta de personal.');
  }

  return response.json();
}
