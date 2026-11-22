import test from 'node:test';
import assert from 'node:assert/strict';
import { listIncidentsApi, createIncidentApi, closeIncidentApi } from '../src/api/incidentsApi.js';

test('incident operations use dedicated endpoints and bearer token', async () => {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ id: '123' }) };
  };
  try {
    await listIncidentsApi('ABIERTA', 'test-token');
    await createIncidentApi('Corte de luz', 'Sede principal', 'test-token');
    await closeIncidentApi('123', 'Solucionado', 'test-token');
    assert.match(calls[0].url, /\/api\/v1\/incidents\?status=ABIERTA$/);
    assert.equal(calls[1].options.method, 'POST');
    assert.equal(JSON.parse(calls[1].options.body).title, 'Corte de luz');
    assert.equal(calls[2].options.method, 'PATCH');
    assert.match(calls[2].url, /\/api\/v1\/incidents\/123\/close$/);
    assert.equal(JSON.parse(calls[2].options.body).reason, 'Solucionado');
    assert.equal(calls[2].options.headers.Authorization, 'Bearer test-token');
  } finally { globalThis.fetch = original; }
});
