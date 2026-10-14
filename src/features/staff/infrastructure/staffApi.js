import { httpClient } from '../../../shared/http/httpClient';

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

export async function inactivateAccountApi(id, token = null) {
  const response = await httpClient(`/api/v1/accounts/${id}/inactivate`, {
    method: 'PATCH',
  }, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al inactivar la cuenta de personal.');
  }

  return response.json();
}
