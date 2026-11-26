import { httpClient } from './httpClient.js';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getPlatformMetricsApi(token) {
  return httpClient('/api/v1/platform/metrics', { headers: authHeaders(token) });
}

export async function listSaasPlansApi(token) {
  return httpClient('/api/v1/platform/plans', { headers: authHeaders(token) });
}

export async function listLicensesApi(token) {
  return httpClient('/api/v1/platform/licenses', { headers: authHeaders(token) });
}

export async function upsertLicenseApi(token, payload) {
  return httpClient('/api/v1/platform/licenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function updateLicenseStatusApi(token, organizationId, payload) {
  return httpClient(`/api/v1/platform/licenses/${organizationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function listCommissionRulesApi(token) {
  return httpClient('/api/v1/platform/commission-rules', { headers: authHeaders(token) });
}

export async function createCommissionRuleApi(token, payload) {
  return httpClient('/api/v1/platform/commission-rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function listCommissionLedgerApi(token, { organizationId = '', status = '' } = {}) {
  const qs = new URLSearchParams();
  if (organizationId) qs.set('organizationId', organizationId);
  if (status) qs.set('status', status);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return httpClient(`/api/v1/platform/commission-ledger${query}`, { headers: authHeaders(token) });
}

export async function calculateCommissionApi(token, payload) {
  return httpClient('/api/v1/platform/commission-ledger/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function updateLedgerStatusApi(token, id, payload) {
  return httpClient(`/api/v1/platform/commission-ledger/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function calculateSimulatorApi(token, payload) {
  return httpClient('/api/v1/platform/simulator/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function listCompanyRequestsApi(token, status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return httpClient(`/api/v1/platform/company-requests${query}`, { headers: authHeaders(token) });
}

export async function reviewCompanyRequestApi(token, id, payload) {
  return httpClient(`/api/v1/platform/company-requests/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function approveCompanyRequestApi(token, id, startTrial = true) {
  return httpClient(`/api/v1/platform/company-requests/${id}/approve?startTrial=${startTrial}`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function exportOrganizationPortableApi(token, organizationId) {
  return httpClient(`/api/v1/platform/export/organization/${organizationId}`, {
    headers: authHeaders(token),
  });
}

export async function getCommercialProfileApi(token, organizationId = '') {
  const q = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  return httpClient(`/api/v1/organization/commercial-profile${q}`, { headers: authHeaders(token) });
}

export async function saveCommercialProfileApi(token, payload) {
  return httpClient('/api/v1/organization/commercial-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function listGroupPromotionsApi(token, { organizationId = '', onlyActive = false } = {}) {
  const qs = new URLSearchParams({ onlyActive: String(onlyActive) });
  if (organizationId) qs.set('organizationId', organizationId);
  return httpClient(`/api/v1/group-promotions?${qs.toString()}`, {
    headers: token ? authHeaders(token) : {},
  });
}

export async function createGroupPromotionApi(token, payload) {
  return httpClient('/api/v1/group-promotions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
}

export async function listGymReviewsApi(organizationId) {
  return httpClient(`/api/v1/gyms/${organizationId}/reviews`);
}

export async function replyGymReviewApi(token, organizationId, reviewId, replyText) {
  return httpClient(`/api/v1/gyms/${organizationId}/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ replyText }),
  });
}
