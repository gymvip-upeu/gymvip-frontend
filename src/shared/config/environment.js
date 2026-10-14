// Configuración pública del entorno frontend GYM VIP
// Solo se accede a variables públicas con prefijo VITE_

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  appName: 'GYM VIP - VIP CENTER FIT',
  version: '1.0.0 (Base Acosta)',
};
