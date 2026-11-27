import assert from 'node:assert/strict';
import test from 'node:test';
import { httpClient, registerUnauthorizedHandler } from '../src/api/httpClient.js';
import { INACTIVITY_MS, readSession, sessionHasEnded } from '../src/services/browserSession.js';

test('la inactividad persiste tras la recarga y el JWT puede vencer antes', () => {
  const token = 'header.' + Buffer.from(JSON.stringify({ exp: 1200 })).toString('base64url') + '.signature';
  const saved = { token, user: { id: 'account' }, lastActivity: 1_000_000 };
  const restored = readSession({ getItem: () => JSON.stringify(saved) });
  assert.equal(sessionHasEnded(restored, 1_199_999), false);
  assert.equal(sessionHasEnded(restored, 1_200_000), true);
  const opaque = { ...saved, token: 'opaque' };
  assert.equal(sessionHasEnded(opaque, saved.lastActivity + INACTIVITY_MS - 1), false);
  assert.equal(sessionHasEnded(opaque, saved.lastActivity + INACTIVITY_MS), true);
});

test('un 401 comunica solo el token de la petición que lo originó', async () => {
  const original = globalThis.fetch;
  const expired = [];
  const unsubscribe = registerUnauthorizedHandler((token) => expired.push(token));
  globalThis.fetch = async () => new Response(null, { status: 401 });
  try {
    await httpClient('/api/v1/auth/mfa/verify-login');
    await httpClient('/api/v1/auth/logout', { method: 'POST' }, 'token-anterior');
    await httpClient('/api/v1/clients', {}, 'token-de-la-petición');
    assert.deepEqual(expired, ['token-de-la-petición']);
  } finally {
    unsubscribe();
    globalThis.fetch = original;
  }
});
