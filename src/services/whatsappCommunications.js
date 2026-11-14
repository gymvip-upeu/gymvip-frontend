import { getCommunicationsApi } from '../api/commsApi';

export const MESSAGE_TYPES = [
  {
    id: 'recordatorio_vencimiento',
    label: 'Recordatorio de vencimiento',
    trigger: 'HU-14 · Según la anticipación configurada',
    original: 'Hola {nombre} 👋, tu plan {plan} en {gimnasio} vence el {fecha} ({dias}). ¡Renueva y sigue entrenando sin pausas! 💪',
  },
  {
    id: 'aviso_vencido',
    label: 'Membresías vencidas',
    trigger: 'HU-14 · Días 1 y 5 si sigue vencida',
    original: 'Hola {nombre}, tu plan {plan} en {gimnasio} venció el {fecha} ({dias}). Si quieres volver a entrenar, puedes renovar en recepción.',
  },
  {
    id: 'renovacion_confirmada',
    label: 'Confirmación de renovación',
    trigger: 'HU-11 · Renovación y pago confirmados',
    original: 'Hola {nombre}, confirmamos la renovación de tu plan {plan} en {gimnasio}. Tu nueva vigencia termina el {fecha}. ¡Nos vemos en el gimnasio!',
  },
  {
    id: 'bienvenida_socio',
    label: 'Bienvenida',
    trigger: 'Alta inicial de una membresía activa',
    original: '¡Bienvenido a {gimnasio}, {nombre}! Tu plan {plan} ya está activo. Si tienes preguntas sobre tu primera visita, recepción puede ayudarte.',
  },
  {
    id: 'aviso_operativo',
    label: 'Avisos operativos',
    trigger: 'Evento operativo autorizado por el gimnasio',
    original: 'Hola {nombre}, te escribimos desde {gimnasio} para informarte: {detalle}. Si tienes dudas, puedes hablar con recepción.',
  },
];

export const EXPIRY_TYPE = MESSAGE_TYPES[0].id;
export const TEMPLATE_VARIABLES = ['nombre', 'plan', 'gimnasio', 'fecha', 'dias', 'detalle'];
const VARIABLE_PATTERN = /\{([a-z_]+)\}/g;
const DRAFT_KEY = 'gymvip.whatsapp-template-drafts.v1';

const STATUS_LABELS = {
  SOLICITADO: 'Pendiente',
  PENDIENTE: 'Pendiente',
  ACEPTADO_PROVEEDOR: 'Pendiente',
  RETRY_TRIGGERED: 'Pendiente',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  LEIDO: 'Entregado',
  FALLIDO: 'Fallido',
};

const limaDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima', dateStyle: 'short' });
const shortDate = new Intl.DateTimeFormat('es-PE', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const attemptDate = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' });
const dayMs = 86_400_000;

export function requiredVariables(type) {
  return [...type.original.matchAll(VARIABLE_PATTERN)].map(([, name]) => name);
}

export function validateTemplate(type, text) {
  if (!text.trim()) return 'Escribe el mensaje de la plantilla.';
  const variables = [...text.matchAll(VARIABLE_PATTERN)].map(([, name]) => name);
  if (/[{}]/.test(text.replace(VARIABLE_PATTERN, '')) || variables.some(name => !TEMPLATE_VARIABLES.includes(name))) {
    return 'Usa variables válidas con el formato {nombre}.';
  }
  const missing = requiredVariables(type).filter(name => !variables.includes(name));
  if (missing.length) return `Incluye los datos obligatorios: ${missing.map(name => `{${name}}`).join(', ')}.`;
  return '';
}

export function readTemplateDrafts() {
  const parsed = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Borradores no disponibles.');
  return Object.fromEntries(MESSAGE_TYPES.filter(type => (
    typeof parsed[type.id] === 'string' && !validateTemplate(type, parsed[type.id])
  )).map(type => [type.id, parsed[type.id]]));
}

export function saveTemplateDraft(type, text) {
  const drafts = { ...readTemplateDrafts(), [type.id]: text.trim() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  return drafts;
}

function asDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? Date.parse(`${value}T00:00:00Z`) : NaN;
}

function dateLabel(value) {
  return Number.isFinite(asDay(value)) ? shortDate.format(asDay(value)) : '';
}

function addDays(value, days) {
  const time = asDay(value) + days * dayMs;
  return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : '';
}

export function formatAttemptDate(value) {
  if (!value) return '';
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const time = Date.parse(hasZone ? value : `${value}-05:00`);
  return Number.isFinite(time) ? attemptDate.format(time) : '';
}

function maskedPhone(value) {
  if (!value) return '';
  const recipient = String(value);
  const digits = recipient.replace(/\D/g, '');
  if (digits.length <= 6 && /^[+\d•*x\s-]+$/i.test(recipient) && /[•*x]/i.test(recipient)) return recipient;
  return digits.length >= 3 ? `••• ${digits.slice(-3)}` : '•••';
}

function resolveType(template, requestId) {
  if (MESSAGE_TYPES.some(type => type.id === template)) return template;
  if (/^ANTICIPATION_\d+$/.test(template) || /-ANTICIPATION_\d+-/.test(requestId)) return EXPIRY_TYPE;
  if (/^POST_EXPIRY_\d+$/.test(template) || /-POST_EXPIRY_\d+-/.test(requestId)) return 'aviso_vencido';
  if (template === 'avisos_operativos') return 'aviso_operativo';
  return null;
}

export function normalizeDispatch(row) {
  const template = String(row.templateName ?? '').trim();
  const requestId = row.requestId ?? '';
  const typeId = resolveType(template, requestId);
  const rule = requestId.match(/-(ANTICIPATION|POST_EXPIRY)_(\d+)-(\d{4}-\d{2}-\d{2})-WHATSAPP$/);
  const params = (row.payloadSummary?.match(/, Parámetros: \[(.*)\]$/s)?.[1] ?? '').split(', ');
  let expiryDate = '';
  let detail = row.detail || '';
  if (typeId === EXPIRY_TYPE || typeId === 'aviso_vencido') {
    const upcoming = typeId === EXPIRY_TYPE;
    const offset = Number(rule?.[2] || (upcoming ? params.at(-1) : params[2]));
    expiryDate = row.expiryDate || (upcoming && /^\d{4}-\d{2}-\d{2}$/.test(params.at(-2) ?? '') ? params.at(-2) : '')
      || (rule ? addDays(rule[3], upcoming ? offset : -offset) : '');
    const interval = `${offset} ${offset === 1 ? 'día' : 'días'}`;
    const when = offset > 0 ? ` · ${upcoming ? `Aviso con ${interval} de anticipación` : `Aviso a ${interval} del vencimiento`}` : '';
    detail ||= dateLabel(expiryDate) ? `${upcoming ? 'Vence' : 'Venció'} el ${dateLabel(expiryDate)}${when}` : '';
  } else if (typeId === 'renovacion_confirmada' && dateLabel(params.at(-1))) {
    detail ||= `Nueva vigencia hasta el ${dateLabel(params.at(-1))}`;
  }

  return {
    ...row,
    typeId,
    templateName: /^ANTICIPATION_|^POST_EXPIRY_/.test(template) ? typeId : template,
    recipientMasked: maskedPhone(row.recipientMasked || row.recipient),
    expiryDate,
    detail: detail || 'Sin detalle del evento',
    statusLabel: STATUS_LABELS[row.status] || 'Sin confirmar',
  };
}

export function filterDispatches(rows, typeId, days, today = limaDay.format()) {
  const start = asDay(today);
  return rows.filter(row => {
    if (row.typeId !== typeId) return false;
    if (typeId !== EXPIRY_TYPE || days === 0) return true;
    const distance = asDay(row.expiryDate) - start;
    return distance >= 0 && distance <= days * dayMs;
  });
}

export async function readWhatsAppDispatches(token, signal) {
  const rows = [];
  const ids = new Set();
  let totalPages = 1;
  let warning = '';
  for (let page = 0; page < totalPages; page += 1) {
    const response = await getCommunicationsApi({ channel: 'WHATSAPP', page, size: 100, signal }, token);
    const content = Array.isArray(response) ? response : response?.content;
    if (!Array.isArray(content)) throw new Error('El historial devolvió una respuesta inválida.');
    warning = response.warning ? 'El historial muestra los registros de respaldo disponibles.' : '';
    if (warning) rows.length = 0;
    for (const row of content) {
      if (row.channel !== 'WHATSAPP' || (!warning && ids.has(row.id))) continue;
      ids.add(row.id);
      rows.push(normalizeDispatch(row));
    }
    totalPages = warning ? 1 : Number(response.totalPages) || 1;
  }
  return { rows, warning };
}

export function makeDemoDispatches(today = limaDay.format()) {
  const fixtures = [
    [0, 'Ana Torres', 'ENTREGADO', 3],
    [0, 'Carla Rojas', 'ENVIADO', 7],
    [0, 'Diego Salas', 'PENDIENTE', 15],
    [0, 'Luis Mendoza', 'FALLIDO', 3],
    [1, 'Jorge Ramos', 'ENTREGADO', -1],
    [1, 'Sofía León', 'PENDIENTE', -5],
    [1, 'Mateo Díaz', 'FALLIDO', -1],
    [2, 'Mariana Cruz', 'ENTREGADO', 'Plan mensual · Renovación confirmada'],
    [2, 'Óscar Peña', 'ENVIADO', 'Plan trimestral · Renovación confirmada'],
    [2, 'Paola Ruiz', 'PENDIENTE', 'Plan mensual · Renovación confirmada'],
    [3, 'Lucía Vega', 'ENTREGADO', 'Primera membresía · Plan mensual activo'],
    [3, 'Gabriel Mora', 'ENVIADO', 'Primera membresía · Plan trimestral activo'],
    [3, 'Elena Vidal', 'FALLIDO', 'Primera membresía · Alta confirmada'],
    [4, 'Nicolás Ríos', 'ENTREGADO', 'Cambio temporal en el horario de atención'],
    [4, 'Isabel Soto', 'PENDIENTE', 'Cambio de horario · Aviso programado'],
    [4, 'Raúl Álvarez', 'FALLIDO', 'Cambio temporal en el horario de atención'],
  ];
  return fixtures.map(([type, clientName, status, event], index) => {
    const expiryDate = typeof event === 'number' ? addDays(today, event) : '';
    const timing = event > 0 ? `En ${event} días` : `Hace ${Math.abs(event)} ${event === -1 ? 'día' : 'días'}`;
    return normalizeDispatch({
      id: `demo-${index}`,
      clientName,
      status,
      channel: 'WHATSAPP',
      recipientMasked: `+51 9•• ••• ${142 + index * 17}`,
      detail: expiryDate ? `${event > 0 ? 'Vence' : 'Venció'} el ${dateLabel(expiryDate)} · ${timing}` : event,
      expiryDate,
      templateName: MESSAGE_TYPES[type].id,
      templateText: MESSAGE_TYPES[type].original,
      createdAt: `${today}T10:00:00-05:00`,
      attemptCount: 1,
      errorMessage: status === 'FALLIDO' ? 'Incidencia temporal del proveedor (simulada).' : '',
      eligible: index !== 6,
    });
  });
}
