// ==============================================================================
// GYM VIP — Servicio de Autenticación y Autorización
// ==============================================================================

import { loginApi, logoutApi, getCurrentUserApi } from '../api/authApi';
import { validateLogin } from '../validators/authValidator';

export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPCION: 'RECEPCION',
  CLIENTE: 'CLIENTE',
};

export async function authenticate(email, password) {
  const errors = validateLogin(email, password);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
  return await loginApi(email, password);
}

export async function signOut(token) {
  return await logoutApi(token);
}

export async function verifySession(token) {
  return await getCurrentUserApi(token);
}

export function hasRole(user, role) {
  if (!user || !user.roles) return false;
  return user.roles.map((r) => r.toUpperCase()).includes(role.toUpperCase());
}

export function isAdminUser(user) {
  return hasRole(user, ROLES.ADMIN);
}

export function isRecepcionUser(user) {
  return hasRole(user, ROLES.RECEPCION);
}
