// ==============================================================================
// GYM VIP — Configuración Pública de Entorno (Frontend)
// ==============================================================================

export const config = {
  apiBaseUrl: (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) || '',
  appName: 'GYM VIP - VIP CENTER FIT',
  version: '1.0.0 (Base Acosta)',
};

export default config;
