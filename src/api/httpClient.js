// ==============================================================================
// GYM VIP — Cliente de Transporte HTTP Centralizado
// ==============================================================================

import { config } from '../config/environment';

let unauthorizedHandler = null;

/**
 * Registra un callback que se ejecutará cuando cualquier petición devuelva HTTP 401 Unauthorized.
 * @param {Function} callback
 */
export function registerUnauthorizedHandler(callback) {
  unauthorizedHandler = callback;
}

/**
 * Realiza una petición HTTP fetch hacia la API de Spring Boot.
 *
 * @param {string} endpoint Ruta relativa del endpoint (ej. "/api/v1/clients")
 * @param {RequestInit} options Opciones de fetch (method, body, headers, etc.)
 * @param {string|null} token Token Bearer opcional
 * @returns {Promise<Response>}
 */
export async function httpClient(endpoint, options = {}, token = null) {
  const url = `${config.apiBaseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && unauthorizedHandler) {
    // Si no es la ruta explícita de login, disparar desautenticación automática
    if (!endpoint.includes('/auth/login')) {
      unauthorizedHandler();
    }
  }

  return response;
}

export default httpClient;
