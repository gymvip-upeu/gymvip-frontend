import test from 'node:test';
import assert from 'node:assert/strict';
import { reportQuery, REPORT_METRICS, getReportApi } from '../src/api/reportsApi.js';

test('reportQuery uses the same checked metrics for screen and export', () => {
  const selected = ['attendance', 'lowStock'];
  const screen = new URLSearchParams(reportQuery('2026-11-01', '2026-11-21', selected));
  const xlsx = new URLSearchParams(reportQuery('2026-11-01', '2026-11-21', selected, 'xlsx'));
  const pdf = new URLSearchParams(reportQuery('2026-11-01', '2026-11-21', selected, 'pdf'));
  assert.equal(screen.get('metrics'), 'attendance,lowStock');
  assert.equal(xlsx.get('metrics'), screen.get('metrics'));
  assert.equal(pdf.get('metrics'), screen.get('metrics'));
  assert.equal(REPORT_METRICS.length, 10);
});

test('reportQuery rejects unknown metrics and invalid date ranges', () => {
  assert.throws(() => reportQuery('2026-11-21', '2026-11-01', ['attendance']));
  assert.throws(() => reportQuery('2026-11-01', '2026-11-21', ['unknown']));
  assert.throws(() => reportQuery('2026-11-01', '2026-11-21', []));
  assert.throws(() => reportQuery('2026-11-01', '2026-11-21', ['attendance'], 'csv'));
});

test('reportes: un error del servidor se muestra y no se interpreta como reporte vacío', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({ message: 'Servicio de reportes no disponible' }) });
  try { await assert.rejects(getReportApi('2026-11-01', '2026-11-23', ['attendance'], 'token'), /no disponible/); }
  finally { globalThis.fetch = original; }
});
