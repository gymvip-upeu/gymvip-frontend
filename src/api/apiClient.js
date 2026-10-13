// Cliente HTTP centralizado para GYM VIP
// Lee VITE_API_BASE_URL para despliegues externos (Render, Vercel) o usa ruta relativa en local.

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiFetch(endpoint, options = {}, token = null) {
  const url = `${API_BASE}${endpoint}`;
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

  return response;
}
