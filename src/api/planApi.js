// ==============================================================================
// GYM VIP — API de Catálogo de Planes (HU-06)
// ==============================================================================

import { httpClient } from './httpClient';

export async function listPlansApi(status = null, token = null) {
  const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
  const response = await httpClient(`/api/v1/plans${query}`, {}, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al obtener la lista de planes.');
  }

  return response.json();
}

export async function getPlanByIdApi(id, token = null) {
  const response = await httpClient(`/api/v1/plans/${id}`, {}, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Plan no encontrado.');
  }

  return response.json();
}

export async function createPlanApi(planData, token = null) {
  const response = await httpClient('/api/v1/plans', {
    method: 'POST',
    body: JSON.stringify(planData),
  }, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al crear el plan.');
  }

  return response.json();
}

export async function updatePlanApi(id, planData, token = null) {
  const response = await httpClient(`/api/v1/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(planData),
  }, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al actualizar el plan.');
  }

  return response.json();
}

export async function setPlanStatusApi(id, status, token = null) {
  const response = await httpClient(`/api/v1/plans/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, token);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || 'Error al actualizar el estado del plan.');
  }

  return response.json();
}
