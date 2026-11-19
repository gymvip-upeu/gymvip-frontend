// ==============================================================================
// GYM VIP — Cliente de Transporte HTTP Centralizado
// ==============================================================================

import { config } from '../config/environment.js';
import { addSentryBreadcrumb, captureSentryException } from '../config/sentry.js';

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
    ...(typeof FormData !== 'undefined' && options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = options.method || 'GET';
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netError) {
    if (netError.name !== 'AbortError') {
      addSentryBreadcrumb('http', `Fallo de red: ${method} ${endpoint}`, { error: netError.message }, 'warning');
    }
    throw netError;
  }

  // Registrar breadcrumb de respuesta HTTP (sin datos sensibles)
  addSentryBreadcrumb('http', `${method} ${endpoint} -> ${response.status}`, {
    status: response.status,
    statusText: response.statusText,
  });

  // Reportar errores técnicos del servidor (5xx) automáticamente a Sentry
  if (response.status >= 500) {
    captureSentryException(new Error(`HTTP ${response.status} en ${method} ${endpoint}`), {
      module: 'httpClient',
      httpStatus: response.status,
      action: `${method} ${endpoint}`,
    });
  }

  if (response.status === 401 && unauthorizedHandler) {
    // Si no es la ruta explícita de login, disparar desautenticación automática
    if (!endpoint.includes('/auth/login')) {
      unauthorizedHandler();
    }
  }

  return response;
}

export default httpClient;
