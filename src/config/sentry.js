// ==============================================================================
// GYM VIP — Configuración Centralizada de Observabilidad y Seguridad con Sentry
// ==============================================================================

import * as Sentry from '@sentry/react';

// DSN canónico del proyecto gymvip-frontend en Sentry
export const DEFAULT_SENTRY_DSN =
  'https://4640964826133bc59e4dacf55008f6a6@o4512046118797312.ingest.us.sentry.io/4512460658769920';

const SENSITIVE_KEYS = [
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'access_token',
  'refresh_token',
];

/**
 * Sanitiza recursivamente objetos o estructuras para eliminar información confidencial.
 */
function sanitizeData(data, depth = 0) {
  if (depth > 5 || data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      cleaned[key] = sanitizeData(value, depth + 1);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Filtro de privacidad y descarte de errores esperados para beforeSend.
 */
function beforeSendFilter(event, hint) {
  const error = hint?.originalException;

  // 1. Descartar cancelaciones voluntarias de red (AbortController)
  if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
    return null;
  }

  // 2. Descartar respuestas de negocio esperadas y manejadas por la UI (400, 401, 404)
  if (error?.status) {
    const status = Number(error.status);
    if (status === 400 || status === 401 || status === 404 || status === 409) {
      // Las respuestas 4xx normales no son caídas del sistema
      return null;
    }
  }

  // 3. Descartar errores comunes y benignos de extensiones del navegador
  const errorMessage = typeof error === 'string' ? error : error?.message || event?.message || '';
  if (
    errorMessage.includes('ResizeObserver loop limit exceeded') ||
    errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
    errorMessage.includes('chrome-extension://') ||
    errorMessage.includes('moz-extension://')
  ) {
    return null;
  }

  // 4. Sanitizar información en headers de request
  if (event.request) {
    if (event.request.headers) {
      event.request.headers = sanitizeData(event.request.headers);
    }
    if (event.request.data) {
      event.request.data = sanitizeData(event.request.data);
    }
  }

  // 5. Sanitizar breadcrumbs incluidos en el evento
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.data) {
        breadcrumb.data = sanitizeData(breadcrumb.data);
      }
      return breadcrumb;
    });
  }

  // 6. Sanitizar campos extra
  if (event.extra) {
    event.extra = sanitizeData(event.extra);
  }

  return event;
}

/**
 * Sanitiza breadcrumbs antes de su registro para evitar capturar contraseñas o tokens.
 */
function beforeBreadcrumbFilter(breadcrumb) {
  // Enmascarar información sensible en categorías fetch o xhr
  if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
    if (breadcrumb.data?.url) {
      try {
        const parsedUrl = new URL(breadcrumb.data.url, window.location.origin);
        // Si la URL contiene query params con token o password, ofuscarlos
        parsedUrl.searchParams.forEach((value, key) => {
          if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
            parsedUrl.searchParams.set(key, '[REDACTED]');
          }
        });
        breadcrumb.data.url = parsedUrl.toString();
      } catch {
        // Ignorar errores de parsing de URL
      }
    }
  }

  // Sanitizar payloads de breadcrumb
  if (breadcrumb.data) {
    breadcrumb.data = sanitizeData(breadcrumb.data);
  }

  return breadcrumb;
}

let isInitialized = false;

/**
 * Inicializa Sentry en el frontend con monitoreo funcional, tracing y replay.
 */
export function initSentry() {
  if (isInitialized) return;

  const dsn =
    (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SENTRY_DSN) ||
    DEFAULT_SENTRY_DSN;

  // Si el DSN está explícitamente vacío o 'false', desactivar
  if (!dsn || dsn === 'false') {
    return;
  }

  const environment =
    (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SENTRY_ENVIRONMENT) ||
    (typeof import.meta !== 'undefined' && import.meta?.env?.MODE) ||
    'development';

  const release =
    (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SENTRY_RELEASE) ||
    'gymvip-frontend@1.0.0';

  const tracesSampleRate = Number(
    (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SENTRY_TRACES_SAMPLE_RATE) ||
      (environment === 'production' ? 0.2 : 1.0)
  );

  const replaysSessionSampleRate = Number(
    (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE) ||
      0.1
  );

  const replaysOnErrorSampleRate = Number(
    (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE) ||
      1.0
  );

  try {
    Sentry.init({
      dsn,
      environment,
      release,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
          maskAllInputs: true,
        }),
      ],
      tracesSampleRate,
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/gymvip-backend\.onrender\.com/,
      ],
      replaysSessionSampleRate,
      replaysOnErrorSampleRate,
      beforeSend: beforeSendFilter,
      beforeBreadcrumb: beforeBreadcrumbFilter,
    });

    isInitialized = true;
  } catch (err) {
    // Sentry init fail-safe: no debe bloquear la carga de la aplicación bajo ninguna circunstancia
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('No se pudo inicializar Sentry:', err);
    }
  }
}

/**
 * Asocia de forma segura el usuario autenticado a Sentry (solo identificador y rol, NUNCA tokens ni contraseñas).
 */
export function setSentryUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id ? String(user.id) : undefined,
    username: user.email || user.username || undefined,
    role: Array.isArray(user.roles) ? user.roles.join(',') : user.roles || undefined,
  });
}

/**
 * Limpia el usuario de Sentry al cerrar sesión.
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Agrega un breadcrumb de contexto operativo a Sentry.
 */
export function addSentryBreadcrumb(category, message, data = {}, level = 'info') {
  Sentry.addBreadcrumb({
    category,
    message,
    data: sanitizeData(data),
    level,
  });
}

/**
 * Captura controlada de excepción con etiquetas de módulo y contexto.
 */
export function captureSentryException(error, context = {}) {
  Sentry.withScope((scope) => {
    if (context.module) scope.setTag('module', context.module);
    if (context.action) scope.setTag('action', context.action);
    if (context.httpStatus) scope.setTag('http_status', String(context.httpStatus));
    if (context.extra) scope.setExtras(sanitizeData(context.extra));
    Sentry.captureException(error);
  });
}

/**
 * Dispara una excepción de prueba intencional controlada para verificar la recepción en Sentry.
 */
export function triggerSentryTestVerification(source = 'manual_test') {
  const testError = new Error(`[GYM VIP Verification] Error controlado de prueba emitido desde ${source}`);
  testError.name = 'GymVipSentryVerificationError';
  
  Sentry.withScope((scope) => {
    scope.setTag('verification_test', 'true');
    scope.setTag('source', source);
    scope.setExtra('timestamp', new Date().toISOString());
    scope.setExtra('note', 'Excepción intencional para verificar conectividad con Sentry.');
    Sentry.captureException(testError);
  });

  return testError;
}

export default {
  initSentry,
  setSentryUser,
  clearSentryUser,
  addSentryBreadcrumb,
  captureSentryException,
  triggerSentryTestVerification,
};
