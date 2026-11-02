import { httpClient } from './httpClient';
async function request(path, token, method = 'GET', body) {
  const response = await httpClient(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, token);
  let value; try { value = await response.json(); } catch { throw new Error('Respuesta incompleta. Recarga antes de repetir la operación.'); }
  if (!response.ok) { const error = new Error(value.message || 'No se pudo completar la operación.'); error.status = response.status; throw error; }
  return value;
}
export const memberOverview = (ids, token) => request(`/api/v1/members/overview?ids=${ids.join(',')}`, token);
export const memberWorkspace = (id, token) => request(`/api/v1/members/${id}`, token);
export const registerMember = (body, token) => request('/api/v1/members', token, 'POST', body);
export const provisionMember = (id, token) => request(`/api/v1/members/${id}/app-access`, token, 'POST');
export const setMemberStatus = (id, body, token) => request(`/api/v1/members/${id}/status`, token, 'PATCH', body);
export const checkInMember = (id, token) => request(`/api/v1/members/${id}/attendance`, token, 'POST');
export const cancelMemberPeriod = (id, period, reason, token) => request(`/api/v1/members/${id}/periods/${period}/cancel`, token, 'POST', { reason });
export const appSession = token => request('/api/v1/member-app/session', token);
export const appProfile = token => request('/api/v1/member-app/me', token);
export const changeMemberPassword = (body, token) => request('/api/v1/member-app/password', token, 'POST', body);
