import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getFacilitiesApi, createFacilityApi, updateFacilityStatusApi, restoreFacilityApi,
  getChannelStatusApi,
} from '../src/api/facilityApi.js';
import { getFaqCatalogApi, createFaqApi, editFaqApi, transitionFaqApi } from '../src/api/faqApi.js';

test('instalaciones: consulta, alta, cambio de estado y restauración conservan autorización y datos', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ id: 'area-1' }) };
  };
  try {
    const signal = new AbortController().signal;
    await getFacilitiesApi('token', signal);
    await createFacilityApi({ name: 'Piscina' }, 'token');
    await updateFacilityStatusApi('area-1', 'INACTIVA', 'Mantenimiento', true, 'token');
    await restoreFacilityApi('area-1', 'token');
    await getChannelStatusApi('token', signal);
    assert.deepEqual(calls.map(({ url }) => new URL(url, 'http://localhost').pathname), [
      '/api/v1/facilities', '/api/v1/facilities', '/api/v1/facilities/area-1/status',
      '/api/v1/facilities/area-1/restore', '/api/v1/channels/status',
    ]);
    assert.deepEqual(calls.map(({ options }) => options.method || 'GET'), ['GET', 'POST', 'PATCH', 'PATCH', 'GET']);
    assert.deepEqual(JSON.parse(calls[2].options.body), { status: 'INACTIVA', reason: 'Mantenimiento', notifyMembers: true });
    assert.ok(calls.every(({ options }) => options.headers.Authorization === 'Bearer token'));
    assert.equal(calls[0].options.signal, signal);
  } finally { globalThis.fetch = original; }
});

test('instalaciones: propaga el error HTTP y su estado para mostrarlo en la pantalla', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ message: 'Área en uso' }) });
  try {
    await assert.rejects(createFacilityApi({ name: 'Piscina' }, 'token'), error =>
      error.status === 409 && error.message === 'Área en uso');
  } finally { globalThis.fetch = original; }
});

test('preguntas frecuentes: edición y publicación envían la revisión para evitar cambios perdidos', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ revision: 3 }) };
  };
  try {
    await getFaqCatalogApi('token');
    await createFaqApi({ question: '¿Horario?', answer: '7 a 22' }, 'token');
    await editFaqApi('faq-1', 2, { question: '¿Horario?', answer: '6 a 22' }, 'token');
    await transitionFaqApi('faq-1', 3, 'publish', 'token');
    assert.deepEqual(calls.map(({ options }) => options.method || 'GET'), ['GET', 'POST', 'PUT', 'POST']);
    assert.deepEqual(JSON.parse(calls[2].options.body), { revision: 2, content: { question: '¿Horario?', answer: '6 a 22' } });
    assert.deepEqual(JSON.parse(calls[3].options.body), { revision: 3 });
    assert.match(calls[3].url, /\/api\/v1\/faqs\/faq-1\/publish$/);
  } finally { globalThis.fetch = original; }
});

test('preguntas frecuentes: rechaza respuestas vacías y conflictos de revisión', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => null });
    await assert.rejects(getFaqCatalogApi('token'), /respuesta incompleta/);
    globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ message: 'Revisión desactualizada' }) });
    await assert.rejects(editFaqApi('faq-1', 1, {}, 'token'), error =>
      error.status === 409 && error.message === 'Revisión desactualizada');
  } finally { globalThis.fetch = original; }
});
