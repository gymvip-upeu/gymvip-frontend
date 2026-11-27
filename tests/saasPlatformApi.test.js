import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPlatformMetricsApi,
  getCommercialProfileApi,
  listGroupPromotionsApi,
  approveCompanyRequestApi,
  calculateCommissionApi,
  calculateSimulatorApi,
  saveCommercialProfileApi,
  createGroupPromotionApi,
} from '../src/api/saasPlatformApi.js';
import { registerUnauthorizedHandler } from '../src/api/httpClient.js';
import { hasPermission } from '../src/services/permissionsService.js';
import { resolveViewFromPath } from '../src/routes/routeConfig.js';

test('RBAC SaaS: SUPER_ADMIN gobierna plataforma; ADMIN de empresa NO tiene platform.manage', () => {
  assert.equal(hasPermission({ roles: ['SUPER_ADMIN'] }, 'platform.manage'), true);
  assert.equal(hasPermission({ roles: ['ADMIN'] }, 'platform.manage'), false);
  assert.equal(hasPermission({ roles: ['ADMIN_EMPRESA'] }, 'platform.manage'), false);
  assert.equal(hasPermission({ roles: ['GERENTE_GENERAL'] }, 'platform.manage'), false);
});

test('Rutas SaaS 2.0 resuelven correctamente plataforma y perfil comercial', () => {
  assert.equal(resolveViewFromPath('/plataforma/resumen'), 'platformDashboard');
  assert.equal(resolveViewFromPath('/plataforma/solicitudes'), 'platformRequests');
  assert.equal(resolveViewFromPath('/plataforma/licencias'), 'platformLicenses');
  assert.equal(resolveViewFromPath('/plataforma/simulador'), 'platformSimulator');
  assert.equal(resolveViewFromPath('/perfil-comercial'), 'commercialProfile');
});

test('saasPlatformApi envía token Bearer y rutas /api/v1 exactas', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, id: '123', status: 'APROBADA' }),
      json: async () => ({ ok: true, id: '123', status: 'APROBADA' }),
    };
  };

  try {
    await getPlatformMetricsApi('tok-sa');
    assert.match(calls.at(-1).url, /\/api\/v1\/platform\/metrics$/);
    assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer tok-sa');

    await approveCompanyRequestApi('tok-sa', 'req-1', true);
    assert.match(calls.at(-1).url, /\/api\/v1\/platform\/company-requests\/req-1\/approve\?startTrial=true$/);
    assert.equal(calls.at(-1).options.method, 'POST');

    await calculateCommissionApi('tok-sa', { paymentStatus: 'PAID', grossAmountPen: 100 });
    assert.match(calls.at(-1).url, /\/api\/v1\/platform\/commission-ledger\/calculate$/);

    await calculateSimulatorApi('tok-sa', { activeGyms: 10 });
    assert.match(calls.at(-1).url, /\/api\/v1\/platform\/simulator\/calculate$/);

    await saveCommercialProfileApi('tok-gym', { headline: 'Fit', publishStatus: 'PUBLICADO' });
    assert.match(calls.at(-1).url, /\/api\/v1\/organization\/commercial-profile$/);
    assert.equal(calls.at(-1).options.method, 'PUT');

    await createGroupPromotionApi('tok-gym', { title: 'Dúo', discountPercent: 15 });
    assert.match(calls.at(-1).url, /\/api\/v1\/group-promotions$/);
  } finally {
    globalThis.fetch = original;
  }
});

test('el portal SaaS devuelve el JSON y propaga 401 con el token de la petición', async () => {
  const original = globalThis.fetch;
  const expired = [];
  const unregister = registerUnauthorizedHandler((token) => expired.push(token));
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ slug: 'sede', publishStatus: 'BORRADOR' }));
    assert.equal((await getCommercialProfileApi('sesion')).slug, 'sede');
    globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Sesión vencida' }), { status: 401 });
    await assert.rejects(getCommercialProfileApi('sesion'), (error) => error.status === 401);
    assert.deepEqual(expired, ['sesion']);
    await assert.rejects(listGroupPromotionsApi('sesion', { onlyActive: true }), (error) => error.status === 401);
    assert.deepEqual(expired, ['sesion']);
  } finally {
    unregister();
    globalThis.fetch = original;
  }
});
