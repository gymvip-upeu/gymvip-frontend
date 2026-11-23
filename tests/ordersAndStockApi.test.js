import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listAdminOrdersApi, getAdminOrderApi, approveOrderPaymentApi, rejectOrderPaymentApi,
  markOrderReadyForPickupApi, inspectPickupTokenApi, deliverOrderByTokenApi,
} from '../src/api/supplementOrderApi.js';
import {
  getSupplementStockApi, recordStockMovementApi, getStockMovementsApi, getStockAlertsApi,
} from '../src/api/supplementStockApi.js';

test('pedidos: recorre pago, preparación y entrega con el mismo pedido', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ id: 'order-1' }) };
  };
  try {
    await listAdminOrdersApi('PENDIENTE', 'token');
    await getAdminOrderApi('order-1', 'token');
    await approveOrderPaymentApi('order-1', { reference: 'OP-123' }, 'token');
    await markOrderReadyForPickupApi('order-1', 'token');
    await inspectPickupTokenApi('ABC/123', 'token');
    await deliverOrderByTokenApi('ABC/123', { deliveredBy: 'Ana' }, 'token');
    assert.match(calls[0].url, /orders\?status=PENDIENTE$/);
    assert.match(calls[2].url, /orders\/order-1\/approve-payment$/);
    assert.deepEqual(JSON.parse(calls[2].options.body), { reference: 'OP-123' });
    assert.match(calls[3].url, /orders\/order-1\/ready-for-pickup$/);
    assert.match(calls[4].url, /pickup\/ABC%2F123$/);
    assert.match(calls[5].url, /pickup\/ABC%2F123\/deliver$/);
    assert.deepEqual(JSON.parse(calls[5].options.body), { deliveredBy: 'Ana' });
    assert.ok(calls.every(({ options }) => options.headers.Authorization === 'Bearer token'));
  } finally { globalThis.fetch = original; }
});

test('pedidos: el rechazo de comprobante y el error de entrega se comunican', async () => {
  const original = globalThis.fetch;
  let call;
  globalThis.fetch = async (url, options) => {
    call = { url, options };
    return { ok: false, status: 409, json: async () => ({ message: 'Pedido ya entregado' }) };
  };
  try {
    await assert.rejects(rejectOrderPaymentApi('order-1', { reason: 'Comprobante ilegible' }, 'token'), /Pedido ya entregado/);
    assert.deepEqual(JSON.parse(call.options.body), { reason: 'Comprobante ilegible' });
    await assert.rejects(deliverOrderByTokenApi('ticket', {}, 'token'), /Pedido ya entregado/);
  } finally { globalThis.fetch = original; }
});

test('stock: consulta disponibilidad, registra movimiento y recupera kardex y alertas', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ stock: 8 }) };
  };
  try {
    await getSupplementStockApi('supp-1', 'token');
    await recordStockMovementApi('supp-1', { movementType: 'SALIDA', quantity: 2 }, 'token');
    await getStockMovementsApi('supp-1', 10, 'token');
    await getStockAlertsApi('token');
    assert.deepEqual(calls.map(({ url }) => new URL(url, 'http://localhost').pathname), [
      '/api/v1/supplements/supp-1/stock', '/api/v1/supplements/supp-1/stock/movement',
      '/api/v1/supplements/supp-1/stock/movements', '/api/v1/supplements/stock/alerts',
    ]);
    assert.equal(new URL(calls[2].url, 'http://localhost').searchParams.get('limit'), '10');
    assert.deepEqual(JSON.parse(calls[1].options.body), { movementType: 'SALIDA', quantity: 2 });
  } finally { globalThis.fetch = original; }
});

test('stock: un movimiento rechazado no se presenta como confirmado', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ message: 'Stock insuficiente' }) });
  try { await assert.rejects(recordStockMovementApi('supp-1', { movementType: 'SALIDA', quantity: 20 }, 'token'), /Stock insuficiente/); }
  finally { globalThis.fetch = original; }
});
