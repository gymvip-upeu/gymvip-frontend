// ==============================================================================
// GYM VIP — Validador UX de Cuentas y Personal (HU-04)
// ==============================================================================

export const STAFF_ROLES = [
  { value: 'ADMIN', label: 'Administrador (Control Total)' },
  { value: 'RECEPCION', label: 'Recepción (Miembros y Consulta)' },
  { value: 'AUDITOR', label: 'Auditoría (Reportes e Incidencias)' },
];

/**
 * Valida los datos requeridos para la creación de una cuenta de personal.
 * Solo se admiten roles ADMIN y RECEPCION. CLIENTE está reservado para móvil.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @returns {string[]} Lista de errores de validación
 */
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
