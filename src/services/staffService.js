// ==============================================================================
// GYM VIP — Servicio de Gestión de Personal y Roles (HU-04)
// ==============================================================================

import { listAccountsApi, createAccountApi, updateAccountRoleApi, updateStaffProfileApi, inactivateAccountApi } from '../api/staffApi';
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
    role: accountData.role,
    roles: [accountData.role],
    firstName: accountData.firstName?.trim() || null,
    lastName: accountData.lastName?.trim() || null,
    phone: accountData.phone?.trim() || null,
  };

  return await createAccountApi(payload, token);
}

export async function modifyStaffRole(id, role, token = null) {
  return await updateAccountRoleApi(id, role, token);
}

export async function modifyStaffProfile(id, profile, token = null) {
  return updateStaffProfileApi(id, {
    email: profile.email.trim(),
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    phone: profile.phone.trim(),
  }, token);
}

export async function inactivateStaffAccount(id, token = null) {
  return await inactivateAccountApi(id, token);
}
