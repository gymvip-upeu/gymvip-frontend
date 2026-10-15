// ==============================================================================
// GYM VIP — Validador UX de Clientes / Socios (HU-01)
// ==============================================================================

import { isAdult } from '../utils/dateUtils';

/**
 * Valida los datos requeridos para el alta de un socio.
 * El correo electrónico es OPCIONAL según las especificaciones de Acosta.
 * La edad mínima debe ser de 18 años.
 *
 * @param {Object} data
 * @returns {string[]} Lista de mensajes de error de validación
 */
export function validateClientRegistration(data) {
  const errors = [];

  if (!data.firstName || !data.firstName.trim()) {
    errors.push('El nombre del socio es obligatorio.');
  }

  if (!data.lastName || !data.lastName.trim()) {
    errors.push('Los apellidos del socio son obligatorios.');
  }

  if (!data.documentType) {
    errors.push('Debe seleccionar el tipo de documento.');
  }

  if (!data.documentNumber || !data.documentNumber.trim()) {
    errors.push('El número de documento es obligatorio.');
  }

  if (!data.birthDate) {
    errors.push('La fecha de nacimiento es obligatoria.');
  } else if (!isAdult(data.birthDate)) {
    errors.push('No se puede registrar a un menor de edad. La edad mínima requerida es 18 años.');
  }

  if (!data.phone || !data.phone.trim()) {
    errors.push('El número telefónico de contacto es obligatorio.');
  }

  // Correo opcional: solo se valida formato si fue ingresado
  if (data.email && data.email.trim() && !data.email.includes('@')) {
    errors.push('Si proporciona un correo electrónico, debe tener un formato válido.');
  }

  return errors;
}
