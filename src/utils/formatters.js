// ==============================================================================
// GYM VIP — Funciones Utilitarias de Formato
// ==============================================================================

/**
 * Formatea un valor numérico a moneda en Soles Peruanos (PEN).
 * @param {number|string} amount
 * @returns {string} Ej: "S/ 120.00"
 */
export function formatCurrencyPen(amount) {
  if (amount === null || amount === undefined || amount === '') return 'S/ 0.00';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return 'S/ 0.00';
  return `S/ ${num.toFixed(2)}`;
}

/**
 * Formatea una fecha ISO a cadena legible en español (Perú).
 * @param {string|Date} dateValue
 * @returns {string} Ej: "15/01/2026"
 */
export function formatDate(dateValue) {
  if (!dateValue) return '-';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-PE');
  } catch {
    return '-';
  }
}

/**
 * Formatea una fecha y hora ISO a cadena legible con hora.
 * @param {string|Date} dateValue
 * @returns {string}
 */
export function formatDateTime(dateValue) {
  if (!dateValue) return '-';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '-';
  }
}

/**
 * Formatea tipo y número de documento.
 * @param {string} type
 * @param {string} number
 * @returns {string}
 */
export function formatDocument(type, number) {
  if (!type && !number) return '-';
  return `${type || 'DOC'}: ${number || '-'}`;
}
