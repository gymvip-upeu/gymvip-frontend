// ==============================================================================
// GYM VIP — Validador Integral de Datos de Entrada (Negocio y Seguridad)
// Validaciones para DNI/CE, teléfonos Perú (+51), email RFC 5322, montos PEN,
// sanitización XSS, rangos de fecha y contraseñas seguras.
// ==============================================================================

/**
 * Expresión regular para DNI peruano: exactamente 8 dígitos numéricos.
 */
export const DNI_REGEX = /^[0-9]{8}$/;

/**
 * Expresión regular para Carné de Extranjería (CE): 9 a 12 caracteres alfanuméricos.
 */
export const CE_REGEX = /^[A-Za-z0-9]{9,12}$/;

/**
 * Expresión regular para Pasaporte: 6 a 12 caracteres alfanuméricos.
 */
export const PASAPORTE_REGEX = /^[A-Za-z0-9]{6,12}$/;

/**
 * Expresión regular para teléfonos celulares de Perú:
 * 9 dígitos iniciando en 9, opcionalmente con código de país +51 o 51.
 */
export const PHONE_PERU_REGEX = /^(?:\+?51\s*)?9\d{8}$/;

/**
 * Expresión regular para email estándar RFC 5322 simplificado.
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Patrones peligrosos de inyección XSS y scripts.
 */
const DANGEROUS_XSS_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|onload=|onerror=|onclick=|<iframe|<object|<embed/i;

/**
 * Sanitiza texto eliminando caracteres de control y tags HTML básicos.
 * @param {string} input
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (input == null) return '';
  if (typeof input !== 'string') return String(input);
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Elimina scripts completos y su contenido
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '') // Elimina etiquetas HTML
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return char;
      }
    });
}

/**
 * Valida un documento de identidad según su tipo (DNI, CE, Pasaporte).
 * @param {string} type Tipo de documento ('DNI', 'CE', 'PASAPORTE')
 * @param {string} number Número de documento
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateDocument(type, number) {
  if (!type || !type.trim()) {
    return { isValid: false, error: 'Debe especificar el tipo de documento.' };
  }
  if (!number || !number.trim()) {
    return { isValid: false, error: 'El número de documento es obligatorio.' };
  }

  const cleanNumber = number.trim();
  const normalizedType = type.trim().toUpperCase();

  switch (normalizedType) {
    case 'DNI':
      if (!DNI_REGEX.test(cleanNumber)) {
        return { isValid: false, error: 'El DNI debe contener exactamente 8 dígitos numéricos.' };
      }
      return { isValid: true };
    case 'CE':
    case 'CARNE_EXTRANJERIA':
      if (!CE_REGEX.test(cleanNumber)) {
        return { isValid: false, error: 'El Carné de Extranjería debe contener entre 9 y 12 caracteres alfanuméricos.' };
      }
      return { isValid: true };
    case 'PASAPORTE':
      if (!PASAPORTE_REGEX.test(cleanNumber)) {
        return { isValid: false, error: 'El Pasaporte debe contener entre 6 y 12 caracteres alfanuméricos.' };
      }
      return { isValid: true };
    default:
      if (cleanNumber.length < 5 || cleanNumber.length > 20) {
        return { isValid: false, error: 'El documento debe tener entre 5 y 20 caracteres.' };
      }
      return { isValid: true };
  }
}

/**
 * Valida un teléfono celular peruano.
 * @param {string} phone
 * @param {boolean} required
 * @returns {{ isValid: boolean, error?: string, normalized?: string }}
 */
export function validatePhonePeru(phone, required = false) {
  if (!phone || !phone.trim()) {
    if (required) {
      return { isValid: false, error: 'El número telefónico es obligatorio.' };
    }
    return { isValid: true, normalized: '' };
  }

  const clean = phone.trim().replace(/[\s-]/g, '');
  if (!PHONE_PERU_REGEX.test(clean)) {
    return { isValid: false, error: 'El teléfono debe ser un celular válido de Perú (9 dígitos, iniciando con 9).' };
  }

  // Normalizar a formato 9 dígitos o +519XXXXXXXX
  const digits = clean.startsWith('+51') ? clean.slice(3) : clean.startsWith('51') && clean.length === 11 ? clean.slice(2) : clean;
  return { isValid: true, normalized: digits };
}

/**
 * Valida un correo electrónico.
 * @param {string} email
 * @param {boolean} required
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateEmail(email, required = true) {
  if (!email || !email.trim()) {
    if (required) {
      return { isValid: false, error: 'El correo electrónico es obligatorio.' };
    }
    return { isValid: true };
  }

  const clean = email.trim();
  if (clean.length > 254) {
    return { isValid: false, error: 'El correo electrónico no puede superar 254 caracteres.' };
  }

  if (!EMAIL_REGEX.test(clean)) {
    return { isValid: false, error: 'El correo electrónico no tiene un formato válido (ejemplo@dominio.com).' };
  }

  return { isValid: true };
}

/**
 * Valida nombre o apellido de una persona natural.
 * @param {string} name
 * @param {string} fieldLabel
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validatePersonName(name, fieldLabel = 'El nombre') {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldLabel} es obligatorio.` };
  }

  const clean = name.trim();
  if (clean.length < 2) {
    return { isValid: false, error: `${fieldLabel} debe tener al menos 2 caracteres.` };
  }
  if (clean.length > 100) {
    return { isValid: false, error: `${fieldLabel} no puede exceder 100 caracteres.` };
  }

  if (DANGEROUS_XSS_PATTERN.test(clean)) {
    return { isValid: false, error: `${fieldLabel} contiene caracteres o secuencias no permitidas por seguridad.` };
  }

  // Letras latinas, tildes, diéresis, ñ, espacios, apóstrofes y guiones
  const nameRegex = /^[A-Za-zÀ-ÿ\u00f1\u00d1\s'-]+$/;
  if (!nameRegex.test(clean)) {
    return { isValid: false, error: `${fieldLabel} solo puede contener letras y espacios.` };
  }

  return { isValid: true };
}

/**
 * Valida un importe monetario en Soles peruanos (PEN).
 * @param {number|string} amount
 * @param {string} fieldLabel
 * @param {{ min?: number, max?: number }} options
 * @returns {{ isValid: boolean, error?: string, parsedAmount?: number }}
 */
export function validateAmountPen(amount, fieldLabel = 'El monto', { min = 0.01, max = 50000.00 } = {}) {
  if (amount === '' || amount == null) {
    return { isValid: false, error: `${fieldLabel} es obligatorio.` };
  }

  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/,/g, '.'));
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: `${fieldLabel} debe ser un valor numérico válido.` };
  }

  if (num < min) {
    return { isValid: false, error: `${fieldLabel} no puede ser menor a S/ ${min.toFixed(2)}.` };
  }

  if (num > max) {
    return { isValid: false, error: `${fieldLabel} no puede ser mayor a S/ ${max.toFixed(2)}.` };
  }

  // Máximo 2 decimales
  const decimals = (String(amount).split('.')[1] || '').length;
  if (decimals > 2) {
    return { isValid: false, error: `${fieldLabel} no puede tener más de 2 cifras decimales.` };
  }

  return { isValid: true, parsedAmount: Math.round(num * 100) / 100 };
}

/**
 * Valida un rango de fechas de membresía o periodo contable.
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate) {
    return { isValid: false, error: 'La fecha de inicio es obligatoria.' };
  }
  if (!endDate) {
    return { isValid: false, error: 'La fecha de fin es obligatoria.' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'La fecha de inicio no es válida.' };
  }
  if (isNaN(end.getTime())) {
    return { isValid: false, error: 'La fecha de fin no es válida.' };
  }

  if (start > end) {
    return { isValid: false, error: 'La fecha de fin debe ser posterior o igual a la fecha de inicio.' };
  }

  return { isValid: true };
}

/**
 * Valida la robustez de una contraseña.
 * Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número.
 * @param {string} password
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validatePasswordSecurity(password) {
  const errors = [];
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['La contraseña es obligatoria.'] };
  }

  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número.');
  }

  return { isValid: errors.length === 0, errors };
}
