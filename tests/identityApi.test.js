// ==============================================================================
// GYM VIP — Pruebas Automatizadas de Consulta de Identidad (ApiPeruDev / DNI)
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupDniApi } from '../src/api/identityApi.js';
import { previewClientImport, confirmClientImport } from '../src/services/clientImportService.js';

test('lookupDniApi: rechaza DNI con formato inválido antes de consultar la red', async () => {
  const invalidDnis = ['', '1234567', '123456789', '7281920A', '  '];

  for (const dni of invalidDnis) {
    await assert.rejects(
      async () => lookupDniApi(dni, 'dummy-token'),
      /8 dígitos numéricos/,
      `Debe rechazar DNI '${dni}' por formato inválido`
    );
  }
});

test('lookupDniApi: ejecuta POST a /api/v1/identity/dni/lookup y retorna respuesta exitosa', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = null;
  let capturedMethod = null;
  let capturedBody = null;
  let capturedHeaders = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedMethod = options.method;
    capturedBody = JSON.parse(options.body);
    capturedHeaders = options.headers;

    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: 'ENCONTRADO',
        dni: '72819201',
        nombres: 'MARIANA',
        apellidoPaterno: 'TORRES',
        apellidoMaterno: 'RAMOS',
        apellidos: 'TORRES RAMOS',
        fuente: 'ApiPeruDev',
        mensaje: 'Datos encontrados en la fuente consultada.',
      }),
    };
  };

  try {
    const res = await lookupDniApi('72819201', 'token-valido-123');

    assert.ok(capturedUrl.includes('/api/v1/identity/dni/lookup'));
    assert.equal(capturedMethod, 'POST');
    assert.equal(capturedBody.dni, '72819201');
    assert.equal(capturedHeaders['Authorization'], 'Bearer token-valido-123');

    assert.equal(res.status, 'ENCONTRADO');
    assert.equal(res.nombres, 'MARIANA');
    assert.equal(res.apellidos, 'TORRES RAMOS');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('lookupDniApi: maneja error HTTP 404 / 429 con mensaje tipificado', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({
      status: 404,
      message: 'DNI no encontrado en el padrón consultado.',
    }),
  });

  try {
    await assert.rejects(
      async () => lookupDniApi('72819200', 'token-valido-123'),
      /no encontrado/,
      'Debe propagar mensaje descriptivo al no encontrar el documento'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
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

