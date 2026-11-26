// ==============================================================================
// GYM VIP — Pruebas de Regresión FASE 1 (COR-10, COR-16, Rutas Nuevas)
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { listAdminOrdersApi } from '../src/api/supplementOrderApi.js';
import { validateClientRegistration } from '../src/validators/clientValidator.js';
import { resolveViewFromPath, VIEW_PATH_MAP } from '../src/routes/routeConfig.js';

test('COR-10: listAdminOrdersApi serializa objeto { status, page, size } sin [object Object]', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  globalThis.fetch = async (url) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({ content: [], totalElements: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    await listAdminOrdersApi({ status: 'PAGADO_POR_VERIFICAR', page: 0, size: 30 }, 'fake-token');
    assert.ok(!capturedUrl.includes('%5Bobject'), 'No debe codificar [object Object]');
    assert.ok(capturedUrl.includes('status=PAGADO_POR_VERIFICAR'));
    assert.ok(capturedUrl.includes('page=0'));
    assert.ok(capturedUrl.includes('size=30'));

    await listAdminOrdersApi({ status: 'TODOS', page: 0, size: 10 }, 'fake-token');
    assert.ok(!capturedUrl.includes('status=TODOS'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('COR-16: validador de DNI exige exactamente 8 dígitos numéricos preservando ceros iniciales', () => {
  const validWithLeadingZero = {
    firstName: 'Lucia',
    lastName: 'Mendoza',
    documentType: 'DNI',
    documentNumber: '07281920',
    birthDate: '1998-05-12',
    phone: '',
    email: '',
    createAccess: false,
  };
  assert.deepEqual(validateClientRegistration(validWithLeadingZero), []);

  const withLetters = { ...validWithLeadingZero, documentNumber: '7281920A' };
  const errs = validateClientRegistration(withLetters);
  assert.ok(errs.some((e) => e.toLowerCase().includes('8 dígitos')));
});

test('COR-01..20: nuevas rutas limpias resuelven correctamente sin romper /instalaciones', () => {
  assert.equal(resolveViewFromPath('/areas'), 'facilities');
  assert.equal(resolveViewFromPath('/instalaciones'), 'facilities');
  assert.equal(resolveViewFromPath('/empresas'), 'branches');
  assert.equal(resolveViewFromPath('/integraciones'), 'integrations');
  assert.equal(resolveViewFromPath('/observabilidad'), 'monitoring');
  assert.equal(VIEW_PATH_MAP.facilities, '/areas');
});
