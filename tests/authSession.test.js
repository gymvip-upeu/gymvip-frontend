import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { validateLogin } from '../src/validators/authValidator.js';

async function authApiWith(transport) {
  const api = new SourceTextModule(await readFile(new URL('../src/api/authApi.js', import.meta.url), 'utf8'));
  await api.link(() => new SyntheticModule(['httpClient'], function () { this.setExport('httpClient', transport); }));
  await api.evaluate();
  return api.namespace;
}

test('validateLogin requires well-formed email and non-empty password', () => {
  assert.equal(validateLogin('', '').length, 2);
  assert.equal(validateLogin('not-an-email', 'ValidPass123!').length, 1);
  assert.equal(validateLogin('admin@vipcenterfit.pe', '').length, 1);
  assert.equal(validateLogin('admin@vipcenterfit.pe', 'Admin123!').length, 0);
});

test('successful unlock/login returns fresh token and account credentials', async () => {
  const expectedAuth = {
    token: 'fresh_uuid_token_999',
    accountId: 1,
    email: 'admin@vipcenterfit.pe',
    roles: ['ADMIN'],
  };

  const api = await authApiWith(async (endpoint, options) => {
    assert.equal(endpoint, '/api/v1/auth/login');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(body.email, 'admin@vipcenterfit.pe');
    assert.equal(body.password, 'Admin123!');
    return {
      ok: true,
      status: 200,
      json: async () => expectedAuth,
    };
  });

  const result = await api.loginApi('admin@vipcenterfit.pe', 'Admin123!');
  assert.equal(result.token, 'fresh_uuid_token_999');
  assert.equal(result.email, 'admin@vipcenterfit.pe');
  assert.deepEqual(result.roles, ['ADMIN']);
});

test('invalid password during session unlock throws rejection and never authorizes', async () => {
  const api = await authApiWith(async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Credenciales de acceso incorrectas' }),
  }));

  await assert.rejects(
    api.loginApi('admin@vipcenterfit.pe', 'WrongPassword!'),
    /Credenciales de acceso incorrectas/
  );
});

test('inactive account during unlock is safely rejected', async () => {
  const api = await authApiWith(async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'La cuenta de acceso se encuentra inactiva' }),
  }));

  await assert.rejects(
    api.loginApi('inactive@vipcenterfit.pe', 'ValidPass!'),
    /La cuenta de acceso se encuentra inactiva/
  );
});

test('network failure during unlock propagates without inventing valid state', async () => {
  const api = await authApiWith(async () => {
    throw new TypeError('Failed to fetch');
  });

  await assert.rejects(
    api.loginApi('admin@vipcenterfit.pe', 'Pass123!'),
    /Failed to fetch/
  );
});

