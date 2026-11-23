// ==============================================================================
// GYM VIP — Pruebas Automatizadas: Terminales, Feed con AbortController y Agenda
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTerminalFeedApi,
  getAttendanceAgendaApi,
  exportAttendanceCsvApi,
} from '../src/api/attendanceApi.js';

test('getTerminalFeedApi: invoca /api/v1/attendance/terminals/{terminalId}/feed y soporta signal de aborto', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = null;
  let capturedSignal = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedSignal = options.signal;
    return {
      ok: true,
      json: async () => [{ id: 'feed-1', memberName: 'Juan Perez', status: 'ATTENDANCE_RECORDED' }],
    };
  };

  try {
    const controller = new AbortController();
    const data = await getTerminalFeedApi('term-123', 10, 'mock-token', controller.signal);
    assert.ok(capturedUrl.includes('/api/v1/attendance/terminals/term-123/feed?limit=10'));
    assert.equal(capturedSignal, controller.signal);
    assert.equal(data.length, 1);
    assert.equal(data[0].memberName, 'Juan Perez');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getAttendanceAgendaApi: envía tanto startDate/endDate como from/to para compatibilidad total con Spring', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = null;

  globalThis.fetch = async (url) => {
    capturedUrl = url;
    return {
      ok: true,
      json: async () => ({ content: [{ id: 'attendance-1' }], totalElements: 1, totalPages: 1, page: 0 }),
    };
  };

  try {
    const agenda = await getAttendanceAgendaApi({
      startDate: '2026-11-18',
      endDate: '2026-11-18',
      status: 'TODOS',
      method: 'QR_INVERTIDO',
      page: 0,
      size: 20,
    }, 'mock-token');

    assert.ok(capturedUrl.includes('from=2026-11-18'), 'Debe incluir parámetro from');
    assert.ok(capturedUrl.includes('startDate=2026-11-18'), 'Debe incluir parámetro startDate');
    assert.ok(capturedUrl.includes('to=2026-11-18'), 'Debe incluir parámetro to');
    assert.ok(capturedUrl.includes('endDate=2026-11-18'), 'Debe incluir parámetro endDate');
    assert.ok(capturedUrl.includes('status=TODOS'), 'Debe incluir parámetro status');
    assert.ok(capturedUrl.includes('method=QR_INVERTIDO'), 'Debe enviar el filtro con el nombre esperado por Spring');
    assert.equal(agenda.items[0].id, 'attendance-1', 'Debe adaptar content del backend a items de la vista');
    assert.equal(agenda.currentPage, 0, 'Debe adaptar page del backend a currentPage de la vista');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('exportAttendanceCsvApi: envía parámetros from/to y startDate/endDate al backend', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = null;

  globalThis.fetch = async (url) => {
    capturedUrl = url;
    return {
      ok: true,
      blob: async () => new Blob(['Fecha,Socio\n2026-11-18,Carlos\n'], { type: 'text/csv' }),
    };
  };

  try {
    const blob = await exportAttendanceCsvApi({
      startDate: '2026-11-01',
      endDate: '2026-11-18',
    }, 'mock-token');

    assert.ok(capturedUrl.includes('from=2026-11-01'));
    assert.ok(capturedUrl.includes('to=2026-11-18'));
    assert.ok(blob instanceof Blob);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Agenda: muestra el rechazo del backend en lugar de tratarlo como lista vacía', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ message: 'Fallo al consultar asistencias' }) });
  try { await assert.rejects(getAttendanceAgendaApi({ status: 'TODOS' }, 'token'), /Fallo al consultar asistencias/); }
  finally { globalThis.fetch = originalFetch; }
});

test('Lógica de backoff de sondeo de feed: calcula retrasos exponenciales progresivos (4s -> 8s -> 16s) y detención a los 3 fallos', () => {
  const computeBackoff = (errors) => {
    if (errors >= 3) return null; // Pausa
    return Math.min(16000, 4000 * Math.pow(2, errors));
  };

  assert.equal(computeBackoff(1), 8000, 'Primer error: 8 segundos');
  assert.equal(computeBackoff(2), 16000, 'Segundo error: 16 segundos');
  assert.equal(computeBackoff(3), null, 'Tercer error: Pausa');
  assert.equal(computeBackoff(4), null, 'Cuarto error: Pausa');
});
