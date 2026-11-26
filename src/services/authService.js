// ==============================================================================
// GYM VIP — Servicio de Autenticación y Autorización (RBAC Enterprise)
// ==============================================================================

import { loginApi, logoutApi, getCurrentUserApi } from '../api/authApi';
import { validateLogin } from '../validators/authValidator';
import { normalizeRoleCode } from './permissionsService';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SOPORTE_PLATAFORMA: 'SOPORTE_PLATAFORMA',
  ADMIN_EMPRESA: 'ADMIN_EMPRESA',
  GERENTE_GENERAL: 'GERENTE_GENERAL',
  AUDITOR_EMPRESA: 'AUDITOR_EMPRESA',
  CONTADOR: 'CONTADOR',
  RECURSOS_HUMANOS: 'RECURSOS_HUMANOS',
  GERENTE_SEDE: 'GERENTE_SEDE',
  RECEPCION: 'RECEPCION',
  CAJERO: 'CAJERO',
  INVENTARIO: 'INVENTARIO',
  ENTRENADOR_JEFE: 'ENTRENADOR_JEFE',
  ENTRENADOR: 'ENTRENADOR',
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
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
  return user.roles.map(normalizeRoleCode).includes(normalizeRoleCode(role));
}

export function isAdminUser(user) {
  return hasRole(user, ROLES.SUPER_ADMIN) || hasRole(user, ROLES.ADMIN) || hasRole(user, ROLES.ADMIN_EMPRESA);
}

export function isGerenteUser(user) {
  return hasRole(user, ROLES.GERENTE) || hasRole(user, ROLES.GERENTE_GENERAL) || hasRole(user, ROLES.GERENTE_SEDE);
}

export function isRecepcionUser(user) {
  return hasRole(user, ROLES.RECEPCION) || hasRole(user, ROLES.CAJERO);
}

export function isAuditorUser(user) {
  return hasRole(user, ROLES.AUDITOR) || hasRole(user, ROLES.AUDITOR_EMPRESA);
}

export function isBusinessExecutive(user) {
  return isGerenteUser(user) || isAdminUser(user);
}
