import { getMembershipHistory, getPaymentMethods, quoteMembership, sellMembership } from '../api/membershipApi';

export { getMembershipHistory, getPaymentMethods, quoteMembership, sellMembership };

// Keep one unresolved operation per tab/worker. Never rotate a key on network failure.
export function pendingStorageKey(email) { return `gymvip_pending_sale:${email}`; }
export function loadPending(storage, key) {
  const raw = storage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
export function persistPending(storage, key, attempt) {
  storage.setItem(key, JSON.stringify(attempt));
}
export function isDefinitiveRejection(status) { return [400, 409].includes(status); }
