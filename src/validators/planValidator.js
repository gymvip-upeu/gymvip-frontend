// ==============================================================================
// GYM VIP — Validador UX de Planes y Tarifas (HU-06)
// ==============================================================================

/**
 * Valida los datos requeridos para la creación o edición de un plan.
 * Invariante de negocio: Denominación mensual exige exactamente 30 días.
 * Precios y duración deben ser estrictamente positivos.
 *
 * @param {string} name
 * @param {string|number} durationDays
 * @param {string|number} pricePen
 * @returns {string[]} Lista de errores de validación
 */
export function validatePlanInputs(name, durationDays, pricePen) {
  const errors = [];

  if (!name || !name.trim()) {
    errors.push('El nombre del plan es obligatorio.');
  }

  const duration = Number(durationDays);
  if ((!Number.isInteger(duration) || duration <= 0)) {
    errors.push('La duración debe ser un número entero positivo de días.');
  }

  const price = Number(pricePen);
  if (!Number.isFinite(price) || price <= 0) {
    errors.push('El precio debe ser un monto positivo en Soles (PEN).');
  }

  // Regla de negocio de gimnasio: denominación mensual = exactamente 30 días
  if (durationDays !== '' && durationDays != null && name && /\b(mensual|mes|monthly)\b/i.test(name) && duration !== 30) {
    errors.push('Los planes con denominación mensual deben tener una duración estándar de exactamente 30 días.');
  }

  // Regla de negocio de gimnasio: denominación diaria = exactamente 1 día
  if (durationDays !== '' && durationDays != null && name && /\b(diario|dia|día|daily)\b/i.test(name) && duration !== 1) {
    errors.push('Los planes con denominación diaria deben tener una duración estándar de exactamente 1 día.');
  }

  return errors;
}

