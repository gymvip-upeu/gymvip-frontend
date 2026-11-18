// ==============================================================================
// GYM VIP — API de Consulta Autoritativa de Identidad (ApiPeruDev / DNI)
// ==============================================================================

import { httpClient } from './httpClient.js';

/**
 * Consulta autoritativa de identidad por DNI mediante el backend de GYM VIP.
 *
 * @param {string} dni Número de documento DNI de 8 dígitos
 * @param {string|null} token Token JWT de autenticación operativa (ADMIN / RECEPCION)
 * @returns {Promise<Object>} Respuesta con status, nombres, apellidos y fuente
 */
export async function lookupDniApi(dni, token = null) {
  if (!dni || !/^\d{8}$/.test(dni.trim())) {
    const err = new Error('El DNI debe constar exactamente de 8 dígitos numéricos.');
    err.status = 400;
    throw err;
  }

  const response = await httpClient('/api/v1/identity/dni/lookup', {
    method: 'POST',
    body: JSON.stringify({ dni: dni.trim() }),
  }, token);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || 'Error al consultar la identidad en ApiPeruDev.';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default {
  lookupDniApi,
};
