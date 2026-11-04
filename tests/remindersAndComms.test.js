// ==============================================================================
// GYM VIP — Pruebas Automatizadas de APIs de Recordatorios y Comunicaciones (HU-14 y HU-18)
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';

async function loadModuleWithTransport(moduleRelativePath, transportFn) {
  const code = await readFile(new URL(moduleRelativePath, import.meta.url), 'utf8');
  const mod = new SourceTextModule(code);
  await mod.link(() => new SyntheticModule(['httpClient'], function () {
    this.setExport('httpClient', transportFn);
  }));
  await mod.evaluate();
  return mod.namespace;
}

test('ReminderApi: getReminderConfigApi consulta /api/v1/reminders/config con token Bearer', async () => {
  let calledUrl = '';
  let calledToken = null;
  const mockConfig = { enabled: true, anticipationDays: [3, 5, 7], postExpiryDays: 2, defaultChannel: 'WHATSAPP' };

  const api = await loadModuleWithTransport('../src/api/reminderApi.js', async (url, opts, token) => {
    calledUrl = url;
    calledToken = token;
    return {
      ok: true,
      json: async () => mockConfig,
    };
  });

  const res = await api.getReminderConfigApi('test-jwt-token');
  assert.equal(calledUrl, '/api/v1/reminders/config');
  assert.equal(calledToken, 'test-jwt-token');
  assert.equal(res.enabled, true);
  assert.deepEqual(res.anticipationDays, [3, 5, 7]);
});

test('ReminderApi: updateReminderConfigApi envía PUT con los parámetros de configuración', async () => {
  let requestRecord = null;

  const api = await loadModuleWithTransport('../src/api/reminderApi.js', async (url, opts, token) => {
    requestRecord = { url, opts, token };
    return {
      ok: true,
      json: async () => ({ status: 'SUCCESS' }),
    };
  });

  const payload = { enabled: true, anticipationDays: [3, 5], postExpiryDays: 3, defaultChannel: 'WHATSAPP' };
  const res = await api.updateReminderConfigApi(payload, 'admin-token');

  assert.equal(requestRecord.url, '/api/v1/reminders/config');
  assert.equal(requestRecord.opts.method, 'PUT');
  assert.equal(requestRecord.opts.body, JSON.stringify(payload));
  assert.equal(requestRecord.token, 'admin-token');
  assert.equal(res.status, 'SUCCESS');
});

test('ReminderApi: evaluateRemindersNowApi envía POST y devuelve métricas del corte ejecutado', async () => {
  const mockCorte = {
    corteFecha: '2026-11-03',
    candidatosEvaluados: 12,
    avisosSolicitados: 5,
    avisosOmitidos: 7,
  };

  const api = await loadModuleWithTransport('../src/api/reminderApi.js', async (url, opts, token) => {
    assert.equal(url, '/api/v1/reminders/evaluate');
    assert.equal(opts.method, 'POST');
    return {
      ok: true,
      json: async () => mockCorte,
    };
  });

  const res = await api.evaluateRemindersNowApi('admin-token');
  assert.equal(res.candidatosEvaluados, 12);
  assert.equal(res.avisosSolicitados, 5);
  assert.equal(res.avisosOmitidos, 7);
});

test('CommsApi: getCommunicationsApi parametriza filtros de status, canal, búsqueda y paginación', async () => {
  let requestedUrl = '';

  const api = await loadModuleWithTransport('../src/api/commsApi.js', async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({ content: [], totalPages: 1 }),
    };
  });

  await api.getCommunicationsApi({
    status: 'FALLIDO',
    channel: 'WHATSAPP',
    search: '987654321',
    page: 2,
    size: 10,
  }, 'token');

  assert.ok(requestedUrl.includes('/api/v1/communications'));
  assert.ok(requestedUrl.includes('status=FALLIDO'));
  assert.ok(requestedUrl.includes('channel=WHATSAPP'));
  assert.ok(requestedUrl.includes('search=987654321'));
  assert.ok(requestedUrl.includes('page=2'));
  assert.ok(requestedUrl.includes('size=10'));
});

test('CommsApi: retryCommunicationApi envía POST a /api/v1/communications/{id}/retry', async () => {
  let invokedUrl = '';
  let invokedMethod = '';

  const api = await loadModuleWithTransport('../src/api/commsApi.js', async (url, opts) => {
    invokedUrl = url;
    invokedMethod = opts?.method;
    return {
      ok: true,
      json: async () => ({ id: '105', status: 'SOLICITADO', attemptCount: 2 }),
    };
  });

  const res = await api.retryCommunicationApi(105, 'admin-token');
  assert.equal(invokedUrl, '/api/v1/communications/105/retry');
  assert.equal(invokedMethod, 'POST');
  assert.equal(res.status, 'SOLICITADO');
  assert.equal(res.attemptCount, 2);
});

test('CommsApi: error HTTP propaga excepción con mensaje descriptivo y código de estado', async () => {
  const api = await loadModuleWithTransport('../src/api/commsApi.js', async () => {
    return {
      ok: false,
      status: 404,
      json: async () => ({ message: 'Registro de comunicación no encontrado' }),
    };
  });

  await assert.rejects(
    api.retryCommunicationApi(999, 'token'),
    (err) => err.status === 404 && err.message === 'Registro de comunicación no encontrado'
  );
});
