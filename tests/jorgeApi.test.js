import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';

async function apiWith(transport) {
  const api = new SourceTextModule(await readFile(new URL('../src/api/jorgeApi.js', import.meta.url), 'utf8'));
  await api.link(() => new SyntheticModule(['httpClient'], function () { this.setExport('httpClient', transport); }));
  await api.evaluate(); return api.namespace;
}
test('network failure never becomes permission', async () => {
  const api = await apiWith(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(api.verifyCoverage('id', 'token'), /Failed to fetch/);
});
test('incomplete or mismatched verification cannot authorize entry', async () => {
  for (const value of [{ allowed: true }, { clientId: 'other', allowed: true, state: 'VIGENTE', checkedAt: 'now', timezone: 'America/Lima' }]) {
    const api = await apiWith(async () => ({ ok: true, json: async () => value }));
    await assert.rejects(api.verifyCoverage('id', 'token'), /inválida/);
  }
});
test('truncated successful edit does not announce success', async () => {
  const api = await apiWith(async () => ({ ok: true, json: async () => { throw new Error('JSON'); } }));
  await assert.rejects(api.updateClient('id', { version: 1 }, 'token'), /No se pudo confirmar/);
});
test('successful edit missing identifiers and version is not acknowledged', async () => {
  const api = await apiWith(async () => ({ ok: true, json: async () => ({}) }));
  await assert.rejects(api.updateClient('id', { version: 1 }, 'token'), /No se pudo confirmar/);
});
test('edit conflicts preserve status and error details for form recovery', async () => {
  const api = await apiWith(async () => ({ ok: false, status: 409, json: async () => ({ message: 'Ficha cambió' }) }));
  await assert.rejects(api.updateClient('id', { version: 1 }, 'token'), e => e.status === 409 && e.message === 'Ficha cambió');
});
test('filters and page are encoded without losing values', async () => {
  let path;
  const api = await apiWith(async url => { path = url; return { ok: true, json: async () => ({ content: [] }) }; });
  await api.listCoverage({ query: 'Ana & José', page: 0, state: 'POR_VENCER', planId: '' }, 'token');
  const params = new URLSearchParams(path.split('?')[1]);
  assert.equal(params.get('query'), 'Ana & José'); assert.equal(params.get('page'), '0'); assert.equal(params.has('planId'), false);
});
