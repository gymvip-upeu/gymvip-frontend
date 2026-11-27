import { httpClient } from './httpClient.js';

async function apiJson(path, options = {}, token = null) {
  const response = await httpClient(path, options, token);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = response.status === 404 ? 'Esta función no está disponible en la versión actual del servidor.' : 'No se pudo completar la solicitud.';
    const error = new Error(response.status === 404 && body?.code === 'ENDPOINT_NOT_FOUND'
      ? fallback : body?.message || fallback);
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function getPlatformMetricsApi(token) {
  return apiJson('/api/v1/platform/metrics', {}, token);
}

export async function listSaasPlansApi(token) {
  return apiJson('/api/v1/platform/plans', {}, token);
}

export async function listLicensesApi(token) {
  return apiJson('/api/v1/platform/licenses', {}, token);
}

export async function upsertLicenseApi(token, payload) {
  return apiJson('/api/v1/platform/licenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateLicenseStatusApi(token, organizationId, payload) {
  return apiJson(`/api/v1/platform/licenses/${organizationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
}

export async function listCommissionRulesApi(token) {
  return apiJson('/api/v1/platform/commission-rules', {}, token);
}

export async function createCommissionRuleApi(token, payload) {
  return apiJson('/api/v1/platform/commission-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function listCommissionLedgerApi(token, { organizationId = '', status = '' } = {}) {
  const qs = new URLSearchParams();
  if (organizationId) qs.set('organizationId', organizationId);
  if (status) qs.set('status', status);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiJson(`/api/v1/platform/commission-ledger${query}`, {}, token);
}

export async function calculateCommissionApi(token, payload) {
  return apiJson('/api/v1/platform/commission-ledger/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateLedgerStatusApi(token, id, payload) {
  return apiJson(`/api/v1/platform/commission-ledger/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
}

export async function calculateSimulatorApi(token, payload) {
  return apiJson('/api/v1/platform/simulator/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function listCompanyRequestsApi(token, status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiJson(`/api/v1/platform/company-requests${query}`, {}, token);
}

export async function reviewCompanyRequestApi(token, id, payload) {
  return apiJson(`/api/v1/platform/company-requests/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
}

export async function approveCompanyRequestApi(token, id, startTrial = true) {
  return apiJson(`/api/v1/platform/company-requests/${id}/approve?startTrial=${startTrial}`, {
    method: 'POST',
  }, token);
}

export async function resendCompanyInvitationApi(token, id) {
  return apiJson('/api/v1/platform/company-requests/' + encodeURIComponent(id) + '/invitation', { method: 'POST' }, token);
}

export async function exportOrganizationPortableApi(token, organizationId) {
  return apiJson(`/api/v1/platform/export/organization/${organizationId}`, {}, token);
}

export async function getCommercialProfileApi(token, organizationId = '') {
  const q = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  return apiJson(`/api/v1/organization/commercial-profile${q}`, {}, token);
}

export async function saveCommercialProfileApi(token, payload) {
  return apiJson('/api/v1/organization/commercial-profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function listGroupPromotionsApi(token, { organizationId = '', onlyActive = false } = {}) {
  const qs = new URLSearchParams({ onlyActive: String(onlyActive) });
  if (organizationId) qs.set('organizationId', organizationId);
  return apiJson(`/api/v1/group-promotions?${qs.toString()}`, {}, onlyActive ? null : token);
}

export async function createGroupPromotionApi(token, payload) {
  return apiJson('/api/v1/group-promotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function listGymReviewsApi(organizationId) {
  return apiJson(`/api/v1/gyms/${organizationId}/reviews`);
}

export async function replyGymReviewApi(token, organizationId, reviewId, replyText) {
  return apiJson(`/api/v1/gyms/${organizationId}/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ replyText }),
  }, token);
}
