import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';

// Exercise the actual transport module without a browser or additional dependencies.
async function apiWith(transport) {
  const code = await readFile(new URL('../src/api/membershipApi.js', import.meta.url), 'utf8');
  const api = new SourceTextModule(code);
  await api.link(() => new SyntheticModule(['httpClient'], function () {
    this.setExport('httpClient', transport);
  }));
  await api.evaluate();
  return api.namespace;
}
const body = { clientId: 'client', planId: 'plan', operation: 'RENEW', amountPen: 120 };

test('a truncated successful response remains uncertain instead of acknowledging a sale', async () => {
  const api = await apiWith(async () => ({ ok: true, json: async () => { throw new SyntaxError('Truncated JSON'); } }));
  await assert.rejects(api.sellMembership(body, 'same-sale-key', 'token'), /respuesta quedó incompleta/);
});

test('a successful response without receipt identifiers is not acknowledged', async () => {
  const api = await apiWith(async () => ({ ok: true, json: async () => ({}) }));
  await assert.rejects(api.sellMembership(body, 'same-sale-key', 'token'), /constancia válida/);
});

test('a conflict retains its HTTP status for the summary recovery flow', async () => {
  const api = await apiWith(async () => ({ ok: false, status: 409, json: async () => ({ message: 'Resumen cambió' }) }));
  await assert.rejects(api.sellMembership(body, 'same-sale-key', 'token'), error => error.status === 409 && error.message === 'Resumen cambió');
});

test('retries preserve the caller key, payload and token and recover the original receipt', async () => {
  const calls = [];
  const receipt = { paymentId: 'payment', periodId: 'period', membershipId: 'membership', clientId: 'client' };
  const api = await apiWith(async (...args) => { calls.push(args); return { ok: true, json: async () => receipt }; });
  assert.equal(await api.sellMembership(body, 'same-sale-key', 'token'), receipt);
  assert.equal(await api.sellMembership(body, 'same-sale-key', 'token'), receipt);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0][1].headers['Idempotency-Key'], 'same-sale-key');
  assert.equal(calls[0][1].body, JSON.stringify(body));
  assert.equal(calls[0][2], 'token');
});

test('network failure propagates as uncertain without inventing an HTTP rejection', async () => {
  const api = await apiWith(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(api.sellMembership(body, 'same-sale-key', 'token'), error => error.status === undefined);
});
