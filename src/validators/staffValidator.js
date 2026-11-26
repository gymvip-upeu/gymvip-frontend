// ==============================================================================
// GYM VIP — Validador UX de Cuentas y Personal (HU-04 / Enterprise RBAC)
// ==============================================================================

export const STAFF_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Administrador (Plataforma SaaS Global)', privileged: true, level: 'PLATFORM' },
  { value: 'ADMIN_EMPRESA', label: 'Administrador de Empresa (Gestión Corporativa Total)', privileged: true, level: 'ORGANIZATION' },
  { value: 'GERENTE_GENERAL', label: 'Gerente General (Finanzas, Catálogo y Sedes)', privileged: false, level: 'ORGANIZATION' },
  { value: 'GERENTE_SEDE', label: 'Gerente de Sede (Operación Local)', privileged: false, level: 'BRANCH' },
  { value: 'RECEPCION', label: 'Recepción (Check-in, Registro y Cobros Mostrador)', privileged: false, level: 'BRANCH' },
  { value: 'ENTRENADOR_JEFE', label: 'Entrenador Jefe (Rutinas, Clases y Metodología)', privileged: false, level: 'BRANCH' },
  { value: 'ENTRENADOR', label: 'Entrenador (Rutinas y Progreso de Socios)', privileged: false, level: 'BRANCH' },
  { value: 'AUDITOR_EMPRESA', label: 'Auditor Empresarial (Solo Lectura Reportes e Incidencias)', privileged: false, level: 'ORGANIZATION' },
  { value: 'SOPORTE_PLATAFORMA', label: 'Soporte de Plataforma (Diagnóstico e Integraciones)', privileged: true, level: 'PLATFORM' },
  { value: 'ADMIN', label: 'Admin TI Legacy (En migración a SUPER_ADMIN / ADMIN_EMPRESA)', privileged: true, level: 'ORGANIZATION' },
  { value: 'GERENTE', label: 'Gerente Legacy (En migración a GERENTE_GENERAL)', privileged: false, level: 'ORGANIZATION' },
  { value: 'AUDITOR', label: 'Auditor Legacy (En migración a AUDITOR_EMPRESA)', privileged: false, level: 'ORGANIZATION' },
];

export function validateStaffCreation(email, password, role) {
  const errors = [];
  if (!email || !email.trim()) {
    errors.push('El correo institucional es obligatorio.');
  } else if (!email.includes('@')) {
    errors.push('Debe ingresar un correo electrónico válido.');
  }

  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres.');
  }

  if (!role || !STAFF_ROLES.some((item) => item.value === role)) {
    errors.push('Debe seleccionar un rol de personal válido.');
  }

  return errors;
}
