// ==============================================================================
// GYM VIP — Configuración y Mapeo Central de Rutas de la Aplicación SPA
// Define las rutas visibles del navegador y su correspondencia con vistas
// ==============================================================================

/**
 * Mapeo de rutas visibles del navegador hacia identificadores de vistas internas.
 * Se diferencian estrictamente de los endpoints /api/v1 del backend.
 */
export const PATH_VIEW_MAP = {
  '/': 'home',
  '/inicio': 'home',
  '/home': 'home',
  '/miembros': 'clients',
  '/miembros/importar': 'clients',
  '/planes': 'plans',
  '/vigencias': 'coverage',
  '/verificacion': 'verification',
  '/membresias': 'memberships',
  '/cobros': 'memberships',
  '/recordatorios': 'reminders',
  '/comunicaciones': 'communications',
  '/personal': 'staff',
  '/configuracion': 'settings',
};

/**
 * Mapeo canónico de identificadores de vista hacia URLs limpias en español.
 */
export const VIEW_PATH_MAP = {
  home: '/inicio',
  clients: '/miembros',
  plans: '/planes',
  coverage: '/vigencias',
  verification: '/verificacion',
  memberships: '/cobros',
  reminders: '/recordatorios',
  communications: '/comunicaciones',
  staff: '/personal',
  settings: '/configuracion',
};

/**
 * Resuelve el identificador de vista interna a partir del pathname del navegador.
 * Normaliza trailing slashes y casos de mayúsculas/minúsculas.
 * @param {string} pathname
 * @returns {string} ID de vista ('home', 'clients', etc.)
 */
export function resolveViewFromPath(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return 'home';
  }
  const clean = pathname.toLowerCase().replace(/\/$/, '') || '/';
  return PATH_VIEW_MAP[clean] || 'home';
}

