// ==============================================================================
// GYM VIP — Servicio de Autenticación y Autorización
// ==============================================================================

import { loginApi, logoutApi, getCurrentUserApi } from '../api/authApi';
import { validateLogin } from '../validators/authValidator';

export const ROLES = {
  ADMIN: 'ADMIN',       // Soporte Técnico / Administrador de Sistemas TI
  GERENTE: 'GERENTE',   // Gerente General / Dirección Ejecutiva de Negocio
  RECEPCION: 'RECEPCION',
  CLIENTE: 'CLIENTE',
  AUDITOR: 'AUDITOR',
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

export function isGerenteUser(user) {
  return hasRole(user, ROLES.GERENTE);
}

export function isRecepcionUser(user) {
  return hasRole(user, ROLES.RECEPCION);
}

export function isAuditorUser(user) {
  return hasRole(user, ROLES.AUDITOR);
}

export function isBusinessExecutive(user) {
  return isGerenteUser(user) || isAdminUser(user);
}
