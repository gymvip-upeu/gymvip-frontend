// ==============================================================================
// GYM VIP — API de Terminales y Agenda de Asistencia (Flujo QR Invertido)
// ==============================================================================

import { httpClient } from './httpClient.js';

/**
 * Lista las terminales autorizadas de mostrador.
 */
export async function getTerminalsApi(token = null) {
  const response = await httpClient('/api/v1/attendance/terminals', {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al listar las terminales de asistencia.');
  }
  return response.json();
}

/**
 * Activa una terminal de mostrador para el operador en sesión.
 */
export async function activateTerminalApi(terminalId, operatorName = '', token = null) {
  const query = operatorName ? `?operator=${encodeURIComponent(operatorName)}` : '';
  const response = await httpClient(`/api/v1/attendance/terminals/${terminalId}/activate${query}`, {
    method: 'POST',
  }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al activar la terminal.');
  }
  return response.json();
}

/**
 * Desactiva una terminal de mostrador.
 */
export async function deactivateTerminalApi(terminalId, token = null) {
  const response = await httpClient(`/api/v1/attendance/terminals/${terminalId}/deactivate`, {
    method: 'POST',
  }, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al desactivar la terminal.');
  }
  return response.json();
}

/**
 * Obtiene el desafío QR dinámico actual con TTL (20 segundos) para la terminal.
 */
export async function getTerminalChallengeApi(terminalId, token = null) {
  const response = await httpClient(`/api/v1/attendance/terminals/${terminalId}/challenge`, {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al generar el desafío QR de la terminal.');
  }
  return response.json();
}

/**
 * Obtiene el feed en vivo de los últimos ingresos validados en la terminal.
 */
export async function getTerminalFeedApi(terminalId, limit = 15, token = null) {
  const response = await httpClient(`/api/v1/attendance/terminals/${terminalId}/feed?limit=${limit}`, {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al consultar el feed de asistencia.');
  }
  return response.json();
}

/**
 * Consulta la agenda general de asistencias con filtros administrativos.
 */
export async function getAttendanceAgendaApi(params = {}, token = null) {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.query) qs.set('query', params.query);
  if (params.status) qs.set('status', params.status);
  if (params.checkInMethod) qs.set('checkInMethod', params.checkInMethod);
  if (params.terminalId) qs.set('terminalId', params.terminalId);
  if (params.page !== undefined) qs.set('page', params.page);
  if (params.size !== undefined) qs.set('size', params.size);

  const response = await httpClient(`/api/v1/attendance/agenda?${qs.toString()}`, {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al consultar la agenda de asistencia.');
  }
  return response.json();
}

/**
 * Descarga el reporte CSV sanitizado de asistencias.
 */
export async function exportAttendanceCsvApi(params = {}, token = null) {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.query) qs.set('query', params.query);
  if (params.status) qs.set('status', params.status);

  const response = await httpClient(`/api/v1/attendance/agenda/export?${qs.toString()}`, {}, token);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al exportar el reporte CSV de asistencias.');
  }
  return response.blob();
}
