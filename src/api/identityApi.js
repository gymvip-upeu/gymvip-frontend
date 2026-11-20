// ==============================================================================
// GYM VIP — API de Consulta Autoritativa de Identidad (ApiPeruDev / DNI)
// ==============================================================================

import { httpClient } from './httpClient.js';

/**
 * Consulta autoritativa de identidad por DNI mediante el backend de GYM VIP.
 *
 * @param {string} dni Número de documento DNI de 8 dígitos
 * @param {string|null} token Token JWT de autenticación operativa (ADMIN / RECEPCION)
 * @param {Object} [options] Opciones adicionales como AbortSignal
 * @returns {Promise<Object>} Respuesta con status, nombres, apellidos y fuente
 */
export async function lookupDniApi(dni, token = null, options = {}) {
  if (!dni || !/^\d{8}$/.test(dni.trim())) {
    const err = new Error('El DNI debe constar exactamente de 8 dígitos numéricos.');
    err.status = 400;
    throw err;
  }

  try {
    const response = await httpClient('/api/v1/identity/dni/lookup', {
      method: 'POST',
      body: JSON.stringify({ dni: dni.trim() }),
      signal: options?.signal,
    }, token);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        (response.status === 500
          ? 'El servicio de consulta de identidad no está disponible temporalmente.'
          : response.status === 404
          ? 'Servicio de consulta no encontrado.'
          : 'Error al consultar el documento de identidad.');
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (!err.status && !err.data) {
      err.message = 'No se pudo conectar con el servidor para la consulta de DNI. Verifique su conexión o reintente.';
    }
    throw err;
  }
}

export default {
  lookupDniApi,
};
