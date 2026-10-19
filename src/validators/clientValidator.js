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
  } else if (data.documentType === 'DNI' && !/^[0-9]{8}$/.test(data.documentNumber.trim())) {
    errors.push('El DNI peruano debe contener exactamente 8 dígitos numéricos.');
  }

  if (!data.birthDate) {
    errors.push('La fecha de nacimiento es obligatoria.');
  } else if (!isAdult(data.birthDate)) {
    errors.push('No se puede registrar a un menor de edad. La edad mínima requerida es 18 años.');
  }

  // Teléfono opcional: solo se valida formato si fue ingresado
  if (data.phone && data.phone.trim() && !/^[+0-9 -]{7,20}$/.test(data.phone.trim())) {
    errors.push('Si proporciona un teléfono de contacto, debe tener un formato válido (7 a 20 dígitos).');
  }

  // Correo opcional: solo se valida formato si fue ingresado
  if (data.email && data.email.trim() && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email.trim())) {
    errors.push('Si proporciona un correo electrónico, debe tener un formato válido.');
  }

  return errors;
}
