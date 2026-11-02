import { httpClient } from './httpClient';

async function request(path, token, options = {}) {
  const response = await httpClient(`/api/v1/memberships${path}`, options, token);
  let data;
  try { data = await response.json(); }
  catch {
    if (response.ok) throw new Error('La respuesta quedó incompleta. Reintente la misma operación para recuperar el resultado.');
    data = {};
  }
  if (!response.ok) {
    const error = new Error(data.message || 'No se pudo completar la operación.');
    error.status = response.status;
    throw error;
  }
  return data;
}
export const getPaymentMethods = token => request('/payment-methods', token);
export const getMembershipHistory = (clientId, token) => request(`/clients/${clientId}/history`, token);
export const quoteMembership = (body, token) => request('/quote', token, {
  method: 'POST', body: JSON.stringify(body),
});
export async function sellMembership(body, key, token) {
  const sale = await request('/sales', token, {
    method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body),
  });
  if (!sale.paymentId || !sale.periodId || !sale.membershipId || !sale.clientId) {
    throw new Error('No se recibió una constancia válida. Reintente la misma operación.');
  }
  return sale;
}
