import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchDashboardMetrics } from '../src/api/dashboardApi.js';

test('DashboardApi: fetchDashboardMetrics consulta /api/v1/dashboard/metrics con token Bearer', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        totalClients: 25,
        activePlans: 4,
        totalAlerts: 2,
        todayAttendance: 8,
        pendingOrders: 1,
        membershipsByStatus: { VIGENTE: 20, VENCIDO: 5 },
        membershipsByPlan: [{ planName: 'VIP Gold', memberCount: 15 }],
        expirationsByInterval: { '1 a 7 días': 2 },
        recentAttendance7Days: [{ date: '2026-11-23', dayName: 'Lun', count: 8 }],
        ordersByStatus: { PENDIENTE: 1, ENTREGADO: 10 },
        financialSummary: {
          monthlyRevenuePen: 4500.0,
          todayRevenuePen: 350.0,
          revenueByMethod: { EFECTIVO: 2000.0, TARJETA: 2500.0 },
        },
      }),
    };
  };

  try {
    const data = await fetchDashboardMetrics('test-jwt-token');
    assert.match(calls[0].url, /\/api\/v1\/dashboard\/metrics$/);
    assert.equal(calls[0].options.headers['Authorization'], 'Bearer test-jwt-token');
    assert.equal(data.totalClients, 25);
    assert.equal(data.activePlans, 4);
    assert.equal(data.financialSummary.monthlyRevenuePen, 4500.0);
    assert.equal(data.recentAttendance7Days.length, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test('DashboardApi: maneja respuestas de rol RECEPCION con financialSummary nulo de forma transparente', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      totalClients: 10,
      activePlans: 3,
      totalAlerts: 1,
      todayAttendance: 5,
      pendingOrders: 0,
      membershipsByStatus: { VIGENTE: 8, VENCIDO: 2 },
      membershipsByPlan: [],
      expirationsByInterval: {},
      recentAttendance7Days: [],
      ordersByStatus: {},
      financialSummary: null, // Rol sin permisos financieros
    }),
  });

  try {
    const data = await fetchDashboardMetrics('recepcion-token');
    assert.equal(data.totalClients, 10);
    assert.equal(data.financialSummary, null, 'financialSummary debe ser nulo para recepcion');
  } finally {
    globalThis.fetch = original;
  }
});

test('DashboardApi: propaga errores de red o servidor con mensaje descriptivo', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ message: 'Error interno en servidor de metricas' }),
  });

  try {
    await assert.rejects(
      fetchDashboardMetrics('invalid-token'),
      error => {
        assert.match(error.message, /Error interno/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = original;
  }
});
