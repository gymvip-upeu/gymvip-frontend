// ==============================================================================
// GYM VIP — Utilidades de Fechas y Validación de Edad
// ==============================================================================

/**
 * Calcula la edad exacta en años a partir de una fecha de nacimiento (YYYY-MM-DD).
 * @param {string} birthDateString
 * @returns {number|null}
 */
export function calculateAge(birthDateString) {
  if (!birthDateString) return null;
  const parts = String(birthDateString).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  const birthDate = new Date(year, month - 1, day);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Comprueba si la persona es mayor de edad (>= 18 años).
 * @param {string} birthDateString
 * @returns {boolean}
 */
export function isAdult(birthDateString) {
  const age = calculateAge(birthDateString);
  return age !== null && age >= 18;
}
