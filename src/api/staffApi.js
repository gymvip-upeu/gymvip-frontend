// ==============================================================================
// GYM VIP — API de Personal, Roles RBAC, Preferencias y MFA (HU-04 / Enterprise)
// ==============================================================================

import { httpClient } from './httpClient.js';

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

export async function updateStaffProfileApi(id, profile, token = null) {
  const response = await httpClient(`/api/v1/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(profile),
  }, token);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al guardar los datos del colaborador.');
  }
  return response.json();
}

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

export async function listRolesCatalogApi(token = null) {
  const response = await httpClient('/api/v1/rbac/roles', {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'No se pudo cargar el catálogo de roles.');
  }
  return response.json();
}

export async function listPermissionsCatalogApi(token = null) {
  const response = await httpClient('/api/v1/rbac/permissions', {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'No se pudo cargar el catálogo de permisos.');
  }
  return response.json();
}

export async function getStaffAuditHistoryApi(token = null, accountId = null) {
  const path = accountId ? `/api/v1/accounts/${accountId}/audit` : '/api/v1/accounts/audit';
  const response = await httpClient(path, {}, token);
  if (!response.ok) return [];
  return response.json();
}

export async function getBranchesApi(token = null) {
  const response = await httpClient('/api/v1/enterprise/branches', {}, token);
  if (!response.ok) return [];
  return response.json();
}

export async function getPreferencesApi(token = null) {
  const response = await httpClient('/api/v1/preferences', {}, token);
  if (!response.ok) return null;
  return response.json();
}

export async function updatePreferencesApi(prefs, token = null) {
  const response = await httpClient('/api/v1/preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs),
  }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'No se pudieron guardar las preferencias.');
  }
  return response.json();
}

export async function enrollMfaApi(token = null) {
  const response = await httpClient('/api/v1/security/mfa/enroll', { method: 'POST' }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'No se pudo iniciar la configuración TOTP.');
  }
  return response.json();
}

export async function verifyMfaApi(code, token = null) {
  const response = await httpClient('/api/v1/security/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Código TOTP inválido.');
  }
  return response.json();
}

export async function disableMfaApi(password, code, token = null) {
  const response = await httpClient('/api/v1/security/mfa/disable', {
    method: 'POST',
    body: JSON.stringify({ password, code }),
  }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'No se pudo desactivar MFA.');
  }
  return response.json();
}

export async function listAssignableStaffRolesApi(token = null) {
  const response = await httpClient('/api/v1/rbac/assignable-roles', {}, token);
  if (!response.ok) throw new Error('No se pudieron consultar los roles que puedes asignar.');
  return response.json();
}

export async function changePrivilegedStaffRoleApi(payload, token) {
  const path = payload.targetRole ? 'migrate-admin-role' : 'revoke-role';
  const response = await httpClient(`/api/v1/security/privileged/${path}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'No se pudo confirmar el cambio de privilegios.');
  }
}
