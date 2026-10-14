// Dominio de personal y cuentas en frontend (HU-04)

export const STAFF_ROLES = [
  { value: 'ADMIN', label: 'Administrador (Control Total)' },
  { value: 'RECEPCION', label: 'Recepción (Socios y Consulta)' },
];

export function validateStaffCreation(email, password, role) {
  const errors = [];
  if (!email || !email.includes('@')) {
    errors.push('Debe ingresar un correo electrónico institucional válido.');
  }
  if (!password || password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres.');
  }
  if (!role) {
    errors.push('Debe seleccionar un rol operativo.');
  }
  return errors;
}
