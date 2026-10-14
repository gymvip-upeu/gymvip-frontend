import { config } from '../config/environment';

let unauthorizedHandler = null;

export function registerUnauthorizedHandler(callback) {
  unauthorizedHandler = callback;
}

export async function httpClient(endpoint, options = {}, token = null) {
  const url = `${config.apiBaseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && unauthorizedHandler) {
    // Solo invocar handler de desautenticación si no es la petición explícita de login
    if (!endpoint.includes('/auth/login')) {
      unauthorizedHandler();
    }
  }

  return response;
}
