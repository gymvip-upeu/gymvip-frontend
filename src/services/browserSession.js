export const SESSION_KEY = 'gymvip_session';
export const INACTIVITY_MS = 15 * 60 * 1000;

export function readSession(storage) {
  try {
    const session = JSON.parse(storage.getItem(SESSION_KEY));
    if (typeof session?.token === 'string' && session.token && session.user &&
        Number.isFinite(session.lastActivity)) return session;
  } catch {
    // An unreadable browser record cannot restore a session.
  }
  return null;
}

function tokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(globalThis.atob(payload));
    return Number.isFinite(exp) ? exp * 1000 : Infinity;
  } catch {
    return Infinity;
  }
}

export function sessionHasEnded(session, now = Date.now()) {
  return !session || now >= Math.min(session.lastActivity + INACTIVITY_MS, tokenExpiry(session.token));
}
