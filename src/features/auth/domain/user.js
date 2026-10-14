// Modelo de usuario y permisos en frontend
export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPCION: 'RECEPCION',
  CLIENTE: 'CLIENTE',
};

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
