import test from 'node:test';
import assert from 'node:assert/strict';
import { listPlansApi, createPlanApi, setPlanStatusApi } from '../src/api/planApi.js';
import { searchClientsApi, registerClientApi } from '../src/api/clientApi.js';
import { memberWorkspace, checkInMember, cancelMemberPeriod, changeMemberPassword } from '../src/api/memberApi.js';

test('planes: lista filtrada, creación y cambio de estado conservan el contrato', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, status: 200, json: async () => ({ id: 'plan-1' }) }; };
  try {
    await listPlansApi('ACTIVO', 'token');
    await createPlanApi({ name: 'Mensual', price: 100 }, 'token');
    await setPlanStatusApi('plan-1', 'INACTIVO', 'token');
    assert.match(calls[0].url, /\/plans\?status=ACTIVO$/);
    assert.equal(calls[1].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[1].options.body), { name: 'Mensual', price: 100 });
    assert.equal(calls[2].options.method, 'PATCH');
    assert.deepEqual(JSON.parse(calls[2].options.body), { status: 'INACTIVO' });
  } finally { globalThis.fetch = original; }
});

test('miembros: búsqueda codifica texto y conserva paginación', async () => {
  const original = globalThis.fetch;
  let url;
  globalThis.fetch = async (nextUrl) => { url = nextUrl; return { ok: true, status: 200, json: async () => ({ content: [], totalElements: 0 }) }; };
  try {
    await searchClientsApi('Ana Pérez', 2, 10, 'token');
    const params = new URL(url, 'http://localhost').searchParams;
    assert.equal(params.get('query'), 'Ana Pérez');
    assert.equal(params.get('page'), '2');
    assert.equal(params.get('size'), '10');
  } finally { globalThis.fetch = original; }
});

test('miembros: un DNI duplicado conserva HTTP 409 y detalles del servidor', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ details: { document: 'duplicated' } }) });
  try {
    await assert.rejects(registerClientApi({ firstName: 'Ana' }, 'token'), error =>
      error.status === 409 && /documento/.test(error.message) && error.details.document === 'duplicated');
  } finally { globalThis.fetch = original; }
});

test('espacio del miembro: consulta, ingreso y cancelación mantienen identificadores', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, status: 200, json: async () => ({ id: 'member-1' }) }; };
  try {
    await memberWorkspace('member-1', 'token');
    await checkInMember('member-1', 'token');
    await cancelMemberPeriod('member-1', 'period-1', 'Solicitado', 'token');
    assert.match(calls[0].url, /\/members\/member-1$/);
    assert.match(calls[1].url, /\/members\/member-1\/attendance$/);
    assert.equal(calls[1].options.method, 'POST');
    assert.match(calls[2].url, /\/members\/member-1\/periods\/period-1\/cancel$/);
    assert.deepEqual(JSON.parse(calls[2].options.body), { reason: 'Solicitado' });
  } finally { globalThis.fetch = original; }
});

test('app del miembro: no confirma cambio de contraseña ante respuesta incompleta', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('JSON truncado'); } });
  try { await assert.rejects(changeMemberPassword({ currentPassword: 'old', newPassword: 'new' }, 'token'), /Respuesta incompleta/); }
  finally { globalThis.fetch = original; }
});
