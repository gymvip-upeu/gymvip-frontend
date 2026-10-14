// Reglas de dominio para planes y tarifas en frontend (HU-06)

export function validatePlanInputs(name, durationDays, pricePen) {
  const errors = [];

  if (!name || !name.trim()) {
    errors.push('El nombre del plan es obligatorio.');
  }

  const duration = parseInt(durationDays, 10);
  if (isNaN(duration) || duration <= 0) {
    errors.push('La duración debe ser un número entero positivo de días.');
  }

  const price = parseFloat(pricePen);
  if (isNaN(price) || price <= 0) {
    errors.push('El precio debe ser un monto positivo en Soles (PEN).');
  }

  // Regla de negocio de gimnasio: denominación mensual = exactamente 30 días
  if (name && /mensual/i.test(name) && duration !== 30) {
    errors.push('Los planes con denominación mensual deben tener una duración estándar de exactamente 30 días.');
  }

  return errors;
}

export function formatCurrencyPen(amount) {
  if (amount === null || amount === undefined) return 'S/ 0.00';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  return `S/ ${num.toFixed(2)}`;
}
