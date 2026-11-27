// ==============================================================================
// GYM VIP — API Cliente para Módulos Empresariales (RRHH, Inventario, Activos,
// Proveedores/Compras, Cajas, Clases/Entrenamiento y Fidelización Opt-in)
// ==============================================================================

import { httpClient } from './httpClient.js';

async function apiJson(path, options = {}, token = null, fallbackErr = 'Operación no completada.') {
  const res = await httpClient(path, options, token);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || fallbackErr);
  }
  return body;
}

export const listHrProfilesApi = (token, branchId = '') =>
  apiJson(`/api/v1/enterprise/ops/hr/profiles${branchId ? `?branchId=${branchId}` : ''}`, {}, token);

export const upsertHrProfileApi = (payload, token) =>
  apiJson('/api/v1/enterprise/ops/hr/profiles', { method: 'POST', body: JSON.stringify(payload) }, token);

export const listHrShiftsApi = (token, branchId = '') =>
  apiJson(`/api/v1/enterprise/ops/hr/shifts${branchId ? `?branchId=${branchId}` : ''}`, {}, token);

export const createHrShiftApi = (payload, token) =>
  apiJson('/api/v1/enterprise/ops/hr/shifts', { method: 'POST', body: JSON.stringify(payload) }, token);

export const listBranchInventoryApi = (token, branchId = '') =>
  apiJson(`/api/v1/enterprise/ops/inventory${branchId ? `?branchId=${branchId}` : ''}`, {}, token);

export const adjustInventoryApi = (payload, token) =>
  apiJson('/api/v1/enterprise/ops/inventory/adjust', { method: 'POST', body: JSON.stringify(payload) }, token);

export const listInventoryMovementsApi = (token, branchId = '') =>
  apiJson(`/api/v1/enterprise/ops/inventory/movements${branchId ? `?branchId=${branchId}` : ''}`, {}, token);

export const listAssetsApi = (token, branchId = '') =>
  apiJson(`/api/v1/enterprise/ops/assets${branchId ? `?branchId=${branchId}` : ''}`, {}, token);

export const createAssetApi = (payload, token) =>
  apiJson('/api/v1/enterprise/ops/assets', { method: 'POST', body: JSON.stringify(payload) }, token);

export const updateAssetStatusApi = (id, operationalStatus, token) =>
  apiJson(`/api/v1/enterprise/ops/assets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ operationalStatus }) }, token);

export const listSuppliersApi = (token) =>
  apiJson('/api/v1/enterprise/ops/suppliers', {}, token);

export const createSupplierApi = (payload, token) =>
  apiJson('/api/v1/enterprise/ops/suppliers', { method: 'POST', body: JSON.stringify(payload) }, token);

export const listPurchaseOrdersApi = (token, branchId = '') =>
  apiJson(`/api/v1/enterprise/ops/purchase-orders${branchId ? `?branchId=${branchId}` : ''}`, {}, token);

export const createPurchaseOrderApi = (payload, token) =>
  apiJson('/api/v1/enterprise/ops/purchase-orders', { method: 'POST', body: JSON.stringify(payload) }, token);

export const receivePurchaseOrderApi = (id, token) =>
  apiJson(`/api/v1/enterprise/ops/purchase-orders/${id}/receive`, { method: 'POST' }, token);

export const listCashRegistersApi = (token, branchId = '') =>
  apiJson(`/api/v1/enterprise/ops/cash-registers${branchId ? `?branchId=${branchId}` : ''}`, {}, token);

export const openCashRegisterApi = (payload, token) =>
  apiJson('/api/v1/enterprise/ops/cash-registers/open', { method: 'POST', body: JSON.stringify(payload) }, token);

export const recordCashMovementApi = (id, payload, token) =>
  apiJson(`/api/v1/enterprise/ops/cash-registers/${id}/movements`, { method: 'POST', body: JSON.stringify(payload) }, token);

export const closeCashRegisterApi = (id, declaredClosingPen, token) =>
  apiJson(`/api/v1/enterprise/ops/cash-registers/${id}/close`, { method: 'POST', body: JSON.stringify({ declaredClosingPen }) }, token);

export const listTrainingClassesApi = (token) =>
  apiJson('/api/v1/training/classes', {}, token);

export const createTrainingClassApi = (payload, token) =>
  apiJson('/api/v1/training/classes', { method: 'POST', body: JSON.stringify(payload) }, token);

export const listTrainingRoutinesApi = (token) =>
  apiJson('/api/v1/training/routines', {}, token);

export const listTrainingExercisesApi = (token) =>
  apiJson('/api/v1/training/exercises', {}, token);

export const createTrainingRoutineApi = (payload, token) =>
  apiJson('/api/v1/training/routines', { method: 'POST', body: JSON.stringify(payload) }, token);

export const getLoyaltyBalanceApi = (clientId, token) =>
  apiJson(`/api/v1/enterprise/ops/loyalty/clients/${clientId}`, {}, token);

export const toggleLoyaltyOptInApi = (clientId, enrolled, token) =>
  apiJson(`/api/v1/enterprise/ops/loyalty/clients/${clientId}/opt-in`, { method: 'POST', body: JSON.stringify({ enrolled }) }, token);

export const recordLoyaltyPointsApi = (clientId, pointsDelta, reason, token) =>
  apiJson(`/api/v1/enterprise/ops/loyalty/clients/${clientId}/points`, { method: 'POST', body: JSON.stringify({ pointsDelta, reason }) }, token);

export const listClassReservationsApi = (classId, token) =>
  apiJson('/api/v1/training/classes/' + encodeURIComponent(classId) + '/reservations', {}, token);

export const listClassNoticesApi = (token) =>
  apiJson('/api/v1/training/classes/notifications', {}, token);

export const listClassTrainersApi = (branchId, token) =>
  apiJson('/api/v1/training/classes/trainers?' + new URLSearchParams({ branchId }), {}, token);

export const listManagedExercisesApi = (branchId, token) =>
  apiJson('/api/v1/training/exercises/manage?' + new URLSearchParams({ branchId }), {}, token);

export const saveExerciseDraftApi = (id, branchId, payload, token) =>
  apiJson(id ? '/api/v1/training/exercises/' + encodeURIComponent(id) + '/draft'
    : '/api/v1/training/exercises?' + new URLSearchParams({ branchId }),
  { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) }, token);

export const publishExerciseApi = (id, token) =>
  apiJson('/api/v1/training/exercises/' + encodeURIComponent(id) + '/publish', { method: 'POST' }, token);
