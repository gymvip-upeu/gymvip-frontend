// ==============================================================================
// GYM VIP — API Client: Dashboard Analítico (Fase 13)
// ==============================================================================

import { httpClient } from './httpClient.js';

/**
 * Consulta las métricas agregadas del panel de control ejecutivo.
 * El backend filtra automáticamente los datos financieros según el rol del usuario (RBAC).
 *
 * @param {string|null} token - Token JWT Bearer
 * @param {Object} [options] - Opciones de fetch (signal de aborto, etc.)
 * @returns {Promise<DashboardMetricsResponse>}
 */
export async function fetchDashboardMetrics(token = null, options = {}) {
  const response = await httpClient('/api/v1/dashboard/metrics', options, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al obtener las métricas del dashboard.');
  }

  return response.json();
}
