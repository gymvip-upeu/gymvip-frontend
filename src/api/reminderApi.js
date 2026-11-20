// ==============================================================================
// GYM VIP — API de Configuración y Cortes de Recordatorios (HU-14)
// ==============================================================================

import { httpClient } from './httpClient';

export async function getReminderConfigApi(token = null) {
  const response = await httpClient('/api/v1/reminders/config', {}, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al obtener la configuración de recordatorios.');
  }
  return response.json();
}

export async function updateReminderConfigApi(configData, token = null) {
  const response = await httpClient('/api/v1/reminders/config', {
    method: 'PUT',
    body: JSON.stringify(configData),
  }, token);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const error = new Error(err.message || 'Error al actualizar la configuración de recordatorios.');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function evaluateRemindersNowApi(token = null) {
  const response = await httpClient('/api/v1/reminders/evaluate', {
    method: 'POST',
  }, token);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const error = new Error(err.message || 'Error al ejecutar el corte manual de recordatorios.');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function getReminderCutsApi(token = null) {
  const response = await httpClient('/api/v1/reminders/cuts', {}, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al consultar el historial de cortes.');
  }
  return response.json();
}

export async function getReminderScheduleApi(token = null) {
  const response = await httpClient('/api/v1/reminders/schedule', {}, token);
  if (!response.ok) throw new Error('No se pudo consultar la programación de recordatorios.');
  const data = await response.json();
  if (typeof data.enabled !== 'boolean' || !data.dailyTime || !data.timeZone) throw new Error('Programación de recordatorios no disponible.');
  return data;
}
