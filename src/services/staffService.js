// ==============================================================================
// GYM VIP — Servicio de Gestión de Personal y Roles (HU-04)
// ==============================================================================

import { listAccountsApi, createAccountApi, updateAccountRoleApi, inactivateAccountApi } from '../api/staffApi';
import { validateStaffCreation } from '../validators/staffValidator';

export async function fetchStaffAccounts(token = null) {
  return await listAccountsApi(token);
}

export async function createStaffAccount(accountData, token = null) {
  const errors = validateStaffCreation(accountData.email, accountData.password, accountData.role);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  const payload = {
    email: accountData.email.trim(),
    password: accountData.password,
    roles: [accountData.role],
  };

  return await createAccountApi(payload, token);
}

export async function modifyStaffRole(id, role, token = null) {
  return await updateAccountRoleApi(id, role, token);
}

export async function inactivateStaffAccount(id, token = null) {
  return await inactivateAccountApi(id, token);
}
