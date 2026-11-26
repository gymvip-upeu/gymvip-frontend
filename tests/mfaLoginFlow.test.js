// ==============================================================================
// GYM VIP — Pruebas de Flujo MFA en 2 Pasos (TEC-09 Frontend)
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { loginApi, verifyMfaLoginApi } from '../src/api/authApi.js';

test('TEC-09: loginApi devuelve desafío MFA y verifyMfaLoginApi emite JWT final tras TOTP válido', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), body: JSON.parse(options.body || '{}') });
    if (String(url).endsWith('/api/v1/auth/login')) {
      return new Response(JSON.stringify({
        token: null,
        id: 'acct-1',
        email: 'admin@vipcenterfit.pe',
        roles: ['SUPER_ADMIN'],
        mfaRequired: true,
        challengeToken: 'mfa-chal-123',
        message: 'Verificación MFA requerida',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      token: 'jwt-final-abc',
      id: 'acct-1',
      email: 'admin@vipcenterfit.pe',
      roles: ['SUPER_ADMIN'],
      mfaRequired: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const step1 = await loginApi('admin@vipcenterfit.pe', 'ClaveSegura123');
    assert.equal(step1.mfaRequired, true);
    assert.equal(step1.token, null);
    assert.equal(step1.challengeToken, 'mfa-chal-123');

    const step2 = await verifyMfaLoginApi(step1.challengeToken, '654321');
    assert.equal(step2.token, 'jwt-final-abc');
    assert.equal(step2.mfaRequired, false);
    assert.ok(calls[1].url.endsWith('/api/v1/auth/mfa/verify-login'));
    assert.deepEqual(calls[1].body, { challengeToken: 'mfa-chal-123', code: '654321' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
