// ==============================================================================
// GYM VIP — Catálogo RBAC Granular y Evaluador de Permisos Efectivos (Frontend)
// Espejo de PermissionCatalog.java (la autoridad definitiva reside en Backend).
// ==============================================================================

const STAFF_CORE_READ = [
  'members.read', 'memberships.read', 'payments.read', 'attendance.read',
  'plans.read', 'inventory.read', 'communications.read', 'branches.read',
  'training.routines.read', 'training.classes.roster', 'supplements.stock.read', 'preferences.manage',
];

const RECEPTION_PERMS = [
  ...STAFF_CORE_READ,
  'members.create', 'members.update', 'memberships.create', 'memberships.renew',
  'payments.create', 'attendance.manage', 'orders.dispatch', 'facilities.update_status',
  'incidents.read', 'incidents.manage', 'communications.drafts',
];

const COACH_PERMS = [
  'branches.read', 'members.read', 'training.routines.read', 'training.routines.create',
  'training.routines.assign', 'training.progress.read', 'training.sessions.log',
  'training.classes.manage', 'training.classes.roster', 'training.classes.notifications', 'training.exercises.edit', 'training.exercises.publish', 'communications.read', 'preferences.manage',
];

const AUDITOR_PERMS = [
  'branches.read', 'reports.read', 'reports.export', 'incidents.read', 'incidents.close',
  'payments.read', 'attendance.read', 'employees.read', 'preferences.manage',
];

const MANAGER_BRANCH_PERMS = [
  ...RECEPTION_PERMS,
  'inventory.adjust', 'inventory.transfer', 'supplements.stock.receive', 'supplements.stock.adjust', 'training.exercises.edit', 'training.classes.notifications', 'training.routines.create', 'training.routines.assign',
  'training.progress.read', 'training.classes.manage', 'reports.read', 'reports.export',
  'incidents.read', 'incidents.manage', 'employees.read', 'communications.configure',
];

const CORP_ADMIN_PERMS = [
  ...MANAGER_BRANCH_PERMS,
  'members.import', 'plans.manage', 'payments.refund', 'employees.create',
  'employees.assign_role', 'employees.inactivate', 'branches.manage',
  'integrations.read', 'integrations.test', 'security.roles.manage', 'training.exercises.publish',
];

const SUPER_ADMIN_PERMS = [
  ...CORP_ADMIN_PERMS,
  'platform.manage', 'security.permissions.manage',
];

export const ROLE_PERMISSION_MAP = {
  SUPER_ADMIN: SUPER_ADMIN_PERMS,
  SOPORTE_PLATAFORMA: ['integrations.read', 'preferences.manage'],
  ADMIN_EMPRESA: CORP_ADMIN_PERMS,
  GERENTE_GENERAL: [...MANAGER_BRANCH_PERMS, 'plans.manage', 'employees.create', 'employees.assign_role', 'employees.inactivate', 'branches.manage', 'integrations.read'],
  AUDITOR_EMPRESA: AUDITOR_PERMS,
  CONTADOR: ['branches.read', 'payments.read', 'reports.read', 'reports.export', 'preferences.manage'],
  RECURSOS_HUMANOS: ['branches.read', 'employees.read', 'employees.create', 'employees.inactivate', 'preferences.manage'],
  GERENTE_SEDE: MANAGER_BRANCH_PERMS,
  RECEPCION: RECEPTION_PERMS,
  CAJERO: ['branches.read', 'members.read', 'memberships.read', 'memberships.create', 'memberships.renew', 'payments.read', 'payments.create', 'orders.dispatch', 'preferences.manage'],
  INVENTARIO: ['branches.read', 'inventory.read', 'inventory.adjust', 'inventory.transfer', 'supplements.stock.read', 'supplements.stock.receive', 'supplements.stock.adjust', 'preferences.manage'],
  COMPRAS: ['branches.read', 'inventory.read', 'preferences.manage'],
  ENTRENADOR_JEFE: [...COACH_PERMS, 'reports.read', 'training.exercises.publish'],
  ENTRENADOR: COACH_PERMS,
  MARKETING: ['branches.read', 'communications.read', 'communications.configure', 'preferences.manage'],
  ATENCION_CLIENTE: ['branches.read', 'members.read', 'memberships.read', 'communications.read', 'incidents.read', 'preferences.manage'],
  MANTENIMIENTO: ['branches.read', 'incidents.read', 'incidents.manage', 'preferences.manage'],
  ADMIN: CORP_ADMIN_PERMS,
  GERENTE: [...MANAGER_BRANCH_PERMS, 'plans.manage', 'employees.create', 'employees.assign_role', 'employees.inactivate', 'branches.manage', 'integrations.read'],
  AUDITOR: AUDITOR_PERMS,
  CLIENTE: ['branches.read', 'memberships.read', 'plans.read', 'inventory.read', 'attendance.read', 'communications.read', 'training.routines.read', 'training.routines.create', 'training.progress.read', 'training.sessions.log', 'training.classes.reserve', 'preferences.manage'],
};

export function normalizeRoleCode(role) {
  return String(role || '').trim().toUpperCase().replace(/^ROLE_/, '');
}

export function resolvePermissionsForRoles(roles = []) {
  const set = new Set();
  for (const r of roles || []) {
    const code = normalizeRoleCode(r);
    const list = ROLE_PERMISSION_MAP[code];
    if (list) list.forEach((p) => set.add(p));
  }
  return Array.from(set);
}

export function resolveEffectivePermissions(user) {
  if (!user) return [];
  return Array.isArray(user.permissions)
    ? Array.from(new Set(user.permissions))
    : resolvePermissionsForRoles(user.roles || []);
}

export function isPlatformSupportOnly(user) {
  const roles = (user?.roles || []).map(normalizeRoleCode).filter(Boolean);
  return roles.length > 0 && roles.every((role) => role === 'SOPORTE_PLATAFORMA');
}

export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  return resolveEffectivePermissions(user).includes(permission);
}

export function hasAnyPermission(user, permissions = []) {
  if (!user || !permissions.length) return false;
  const effective = new Set(resolveEffectivePermissions(user));
  return permissions.some((p) => effective.has(p));
}

export function isStaffAccount(account) {
  const roles = (account?.roles || []).map(normalizeRoleCode);
  return roles.some((r) => r && r !== 'CLIENTE');
}
