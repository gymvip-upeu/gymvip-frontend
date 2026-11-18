// ==============================================================================
// GYM VIP — API de Control de Stock y Kardex de Suplementos
// ==============================================================================

import { httpClient } from './httpClient.js';

export async function getSupplementStockApi(supplementId, token = null) {
  const response = await httpClient(`/api/v1/supplements/${supplementId}/stock`, {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al obtener stock del suplemento.');
  }
  return response.json();
}

export async function recordStockMovementApi(supplementId, movementData, token = null) {
  const response = await httpClient(`/api/v1/supplements/${supplementId}/stock/movement`, {
    method: 'POST',
    body: JSON.stringify(movementData),
  }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al registrar movimiento de stock.');
  }
  return response.json();
}

export async function getStockMovementsApi(supplementId, limit = 50, token = null) {
  const response = await httpClient(`/api/v1/supplements/${supplementId}/stock/movements?limit=${limit}`, {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al obtener el historial de movimientos.');
  }
  return response.json();
}

export async function getStockAlertsApi(token = null) {
  const response = await httpClient('/api/v1/supplements/stock/alerts', {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al consultar alertas de stock.');
  }
  return response.json();
}
