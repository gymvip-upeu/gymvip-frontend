// ==============================================================================
// GYM VIP — Pruebas Automatizadas de Consulta de Identidad (ApiPeruDev / DNI)
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { previewClientImport, confirmClientImport } from '../src/services/clientImportService.js';

async function loadIdentityApiWithTransport(transportFn) {
  const code = await readFile(new URL('../src/api/identityApi.js', import.meta.url), 'utf8');
  const mod = new SourceTextModule(code);
  await mod.link(() => new SyntheticModule(['httpClient'], function () {
    this.setExport('httpClient', transportFn);
  }));
  await mod.evaluate();
  return mod.namespace;
}

test('lookupDniApi: rechaza DNI con formato inválido antes de consultar la red', async () => {
  const invalidDnis = ['', '1234567', '123456789', '7281920A', '  '];
  const api = await loadIdentityApiWithTransport(async () => {
    throw new Error('No debe llamar a la red con DNI inválido');
  });

  for (const dni of invalidDnis) {
    await assert.rejects(
      async () => api.lookupDniApi(dni, 'dummy-token'),
      /8 dígitos numéricos/,
      `Debe rechazar DNI '${dni}' por formato inválido`
    );
  }
});

test('lookupDniApi: ejecuta POST a /api/v1/identity/dni/lookup y retorna respuesta exitosa', async () => {
  let capturedUrl = null;
  let capturedOpts = null;
  let capturedToken = null;

  const mockPayload = {
    status: 'ENCONTRADO',
    dni: '72819201',
    nombres: 'MARIANA',
    apellidoPaterno: 'TORRES',
    apellidoMaterno: 'RAMOS',
    apellidos: 'TORRES RAMOS',
    fuente: 'ApiPeruDev',
    mensaje: 'Datos encontrados en la fuente consultada.',
  };

  const api = await loadIdentityApiWithTransport(async (url, opts, token) => {
    capturedUrl = url;
    capturedOpts = opts;
    capturedToken = token;
    return {
      ok: true,
      status: 200,
      json: async () => mockPayload,
    };
  });

  const res = await api.lookupDniApi('72819201', 'token-valido-123');

  assert.equal(capturedUrl, '/api/v1/identity/dni/lookup');
  assert.equal(capturedOpts.method, 'POST');
  assert.equal(JSON.parse(capturedOpts.body).dni, '72819201');
  assert.equal(capturedToken, 'token-valido-123');

  assert.equal(res.status, 'ENCONTRADO');
  assert.equal(res.nombres, 'MARIANA');
  assert.equal(res.apellidos, 'TORRES RAMOS');
});

test('lookupDniApi: maneja error HTTP 404 / 429 con mensaje tipificado', async () => {
  const api = await loadIdentityApiWithTransport(async () => {
    return {
      ok: false,
      status: 404,
      json: async () => ({
        status: 404,
        message: 'DNI no encontrado en el padrón consultado.',
      }),
    };
  });

  await assert.rejects(
    async () => api.lookupDniApi('72819200', 'token-valido-123'),
    /no encontrado/,
    'Debe propagar mensaje descriptivo al no encontrar el documento'
  );
});

test('clientImportService: previewClientImport y confirmClientImport incluyen verifyDni en query param', async () => {
  const originalFetch = globalThis.fetch;
  const capturedUrls = [];

  globalThis.fetch = async (url) => {
    capturedUrls.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => ({ totalRows: 1, validCount: 1, rows: [] }),
    };
  };

  try {
    const dummyBlob = new Blob(['dummy content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dummyFile = new File([dummyBlob], 'socios.xlsx', { type: dummyBlob.type });

    await previewClientImport(dummyFile, 'tok1', true);
    await confirmClientImport(dummyFile, 'tok1', true);

    assert.ok(capturedUrls[0].includes('verifyDni=true'), 'preview debe incluir verifyDni=true');
    assert.ok(capturedUrls[1].includes('verifyDni=true'), 'confirm debe incluir verifyDni=true');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
