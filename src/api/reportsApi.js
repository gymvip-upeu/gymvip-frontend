import { httpClient } from './httpClient.js';

export const REPORT_METRICS = [
  ['memberRegistrations', 'Socios registrados'],
  ['attendance', 'Asistencias'],
  ['plansAssigned', 'Planes asignados'],
  ['expirations', 'Membresías por vencer'],
  ['membershipPaymentsPen', 'Cobros de membresías (PEN)'],
  ['supplementOrders', 'Pedidos de suplementos'],
  ['supplementUnits', 'Unidades vendidas'],
  ['lowStock', 'Suplementos con stock bajo (actual)'],
  ['promotions', 'Promociones creadas'],
  ['announcements', 'Avisos publicados'],
];

export function reportQuery(from, to, metrics, format = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to)
    throw new Error('Selecciona un rango válido.');
  const allowed = new Set(REPORT_METRICS.map(([key]) => key));
  if (!Array.isArray(metrics) || metrics.length === 0 || metrics.some(key => !allowed.has(key)))
    throw new Error('Selecciona al menos una métrica válida.');
  const query = new URLSearchParams({ from, to, metrics: metrics.join(',') });
  if (format) {
    if (!['xlsx', 'pdf'].includes(format)) throw new Error('Formato no permitido.');
    query.set('format', format);
  }
  return query.toString();
}

export async function getReportApi(from, to, metrics, token) {
  const response = await httpClient(`/api/v1/reports?${reportQuery(from, to, metrics)}`, {}, token);
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'No se pudo cargar el reporte.');
  return response.json();
}

export async function exportReportApi(from, to, metrics, format, token) {
  const response = await httpClient(`/api/v1/reports/export?${reportQuery(from, to, metrics, format)}`, {}, token);
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'No se pudo exportar el reporte.');
  return response.blob();
}
