// ==============================================================================
// GYM VIP — Validador UX de Autenticación
// ==============================================================================

export function validateLogin(email, password) {
  const errors = [];
  if (!email || !email.trim()) {
    errors.push('El correo institucional es obligatorio.');
  } else if (!email.includes('@')) {
    errors.push('El correo debe tener un formato válido (ejemplo@dominio.com).');
  }

  if (!password || !password.trim()) {
    errors.push('La contraseña es obligatoria.');
  }

  return errors;
}
