import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listAccountsApi, createAccountApi, updateAccountRoleApi, updateStaffProfileApi, inactivateAccountApi,
} from '../src/api/staffApi.js';
import { getClientGuardiansApi, registerGuardianApi, deleteGuardianApi } from '../src/api/clientGuardianApi.js';

test('personal: alta, cambio de rol, perfil e inactivación usan los métodos y cuerpos esperados', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ id: 'staff-1' }) };
  };
  try {
    await listAccountsApi('token');
    await createAccountApi({ email: 'recepcion@ejemplo.pe', role: 'RECEPCION' }, 'token');
    await updateAccountRoleApi('staff-1', 'ADMIN', 'token');
    await updateStaffProfileApi('staff-1', { firstName: 'Ana' }, 'token');
    await inactivateAccountApi('staff-1', 'token');
    assert.deepEqual(calls.map(({ options }) => options.method || 'GET'), ['GET', 'POST', 'PATCH', 'PATCH', 'PATCH']);
    assert.match(calls[2].url, /\/accounts\/staff-1\/role$/);
    assert.deepEqual(JSON.parse(calls[2].options.body), { role: 'ADMIN' });
    assert.deepEqual(JSON.parse(calls[4].options.body), { status: 'INACTIVO' });
    assert.ok(calls.every(({ options }) => options.headers.Authorization === 'Bearer token'));
  } finally { globalThis.fetch = original; }
});

test('personal: muestra el rechazo del servidor al cambiar un rol', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ message: 'Acceso denegado' }) });
  try { await assert.rejects(updateAccountRoleApi('staff-1', 'ADMIN', 'token'), /Acceso denegado/); }
  finally { globalThis.fetch = original; }
});

test('apoderados: consulta, registro y eliminación usan el cliente correcto', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: options.method === 'DELETE' ? 204 : 200, json: async () => ({ id: 'guardian-1' }) };
  };
  try {
    await getClientGuardiansApi('client-1', 'token');
    await registerGuardianApi('client-1', { fullName: 'María Pérez' }, 'token');
    assert.equal(await deleteGuardianApi('client-1', 'guardian-1', 'token'), true);
    assert.deepEqual(calls.map(({ url }) => new URL(url, 'http://localhost').pathname), [
      '/api/v1/clients/client-1/guardians', '/api/v1/clients/client-1/guardians',
      '/api/v1/clients/client-1/guardians/guardian-1',
    ]);
    assert.deepEqual(calls.map(({ options }) => options.method || 'GET'), ['GET', 'POST', 'DELETE']);
    assert.deepEqual(JSON.parse(calls[1].options.body), { fullName: 'María Pérez' });
  } finally { globalThis.fetch = original; }
});

test('apoderados: un error al eliminar no se informa como éxito', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ message: 'Apoderado asociado' }) });
  try { await assert.rejects(deleteGuardianApi('client-1', 'guardian-1', 'token'), /Apoderado asociado/); }
  finally { globalThis.fetch = original; }
});
