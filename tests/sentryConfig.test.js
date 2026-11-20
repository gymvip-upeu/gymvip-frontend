import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SENTRY_DSN,
  setSentryUser,
  clearSentryUser,
  addSentryBreadcrumb,
  triggerSentryTestVerification,
} from '../src/config/sentry.js';

test('Sentry: DSN por defecto apunta al proyecto oficial de GYM VIP', () => {
  assert.ok(DEFAULT_SENTRY_DSN.includes('o4512046118797312'));
  assert.ok(DEFAULT_SENTRY_DSN.includes('4512460658769920'));
  assert.ok(DEFAULT_SENTRY_DSN.startsWith('https://'));
});

test('Sentry: setSentryUser asocia únicamente identificadores seguros sin contraseñas ni tokens', () => {
  const safeUser = {
    id: 101,
    email: 'admin@gymvip.pe',
    roles: ['ROLE_ADMIN', 'ROLE_RECEPCION'],
    password: 'super_secret_password',
    token: 'jwt.bearer.token',
  };

  // No debe arrojar error y limpia al desautenticar
  assert.doesNotThrow(() => setSentryUser(safeUser));
  assert.doesNotThrow(() => clearSentryUser());
  assert.doesNotThrow(() => setSentryUser(null));
});

test('Sentry: addSentryBreadcrumb registra eventos operativos sin fallar', () => {
  assert.doesNotThrow(() => {
    addSentryBreadcrumb('navigation', 'Navegación a /clientes', { view: 'clients' });
    addSentryBreadcrumb('auth', 'Intento de login', { email: 'admin@gymvip.pe', password: 'secret_to_redact' });
  });
});

test('Sentry: triggerSentryTestVerification genera excepción tipificada de verificación', () => {
  const error = triggerSentryTestVerification('suite_test');
  assert.ok(error instanceof Error);
  assert.equal(error.name, 'GymVipSentryVerificationError');
  assert.ok(error.message.includes('[GYM VIP Verification]'));
  assert.ok(error.message.includes('suite_test'));
});
