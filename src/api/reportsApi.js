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

export const REPORT_TEMPLATES = [
  {
    id: 'executive_summary',
    name: 'Resumen Ejecutivo Mensual',
    description: 'Indicadores clave de altas, asistencias, membresías y recaudación',
    metrics: ['memberRegistrations', 'attendance', 'plansAssigned', 'membershipPaymentsPen'],
    chartType: 'bar',
  },
  {
    id: 'retention_expirations',
    name: 'Retención y Vencimientos',
    description: 'Control de membresías por vencer y nuevas asignaciones',
    metrics: ['plansAssigned', 'expirations', 'memberRegistrations'],
    chartType: 'bar',
  },
  {
    id: 'supplements_sales',
    name: 'Ventas y Stock de Suplementos',
    description: 'Pedidos confirmados, volumen de venta y alertas de inventario',
    metrics: ['supplementOrders', 'supplementUnits', 'lowStock'],
    chartType: 'bar',
  },
  {
    id: 'attendance_operations',
    name: 'Operaciones y Asistencia',
    description: 'Afluencia en torniquetes y eventos operacionales',
    metrics: ['attendance', 'plansAssigned', 'announcements'],
    chartType: 'line',
  },
];

export const DATE_PRESETS = [
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'last_7_days', label: 'Últimos 7 días' },
  { id: 'last_30_days', label: 'Últimos 30 días' },
  { id: 'this_month', label: 'Mes actual' },
  { id: 'last_month', label: 'Mes anterior' },
  { id: 'custom', label: 'Personalizado' },
];

export function calculateDatePreset(presetId) {
  const limaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const formatIso = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatIso(limaNow);

  switch (presetId) {
    case 'today':
      return { from: todayStr, to: todayStr };
    case 'yesterday': {
      const y = new Date(limaNow);
      y.setDate(y.getDate() - 1);
      const yStr = formatIso(y);
      return { from: yStr, to: yStr };
    }
    case 'last_7_days': {
      const past7 = new Date(limaNow);
      past7.setDate(past7.getDate() - 6);
      return { from: formatIso(past7), to: todayStr };
    }
    case 'last_30_days': {
      const past30 = new Date(limaNow);
      past30.setDate(past30.getDate() - 29);
      return { from: formatIso(past30), to: todayStr };
    }
    case 'this_month': {
      const firstDay = new Date(limaNow.getFullYear(), limaNow.getMonth(), 1);
      return { from: formatIso(firstDay), to: todayStr };
    }
    case 'last_month': {
      const firstDayLastMonth = new Date(limaNow.getFullYear(), limaNow.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(limaNow.getFullYear(), limaNow.getMonth(), 0);
      return { from: formatIso(firstDayLastMonth), to: formatIso(lastDayLastMonth) };
    }
    default:
      return { from: `${todayStr.slice(0, 7)}-01`, to: todayStr };
  }
}

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
