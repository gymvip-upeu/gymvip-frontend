import { httpClient } from '../../../shared/http/httpClient';

export async function loginApi(email, password) {
  const response = await httpClient('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Credenciales no válidas.');
  }

  return response.json();
}

export async function logoutApi(token) {
  if (!token) return;
  try {
    await httpClient('/api/v1/auth/logout', { method: 'POST' }, token);
  } catch (err) {
    // Silencio en logout local
  }
}

export async function getCurrentUserApi(token) {
  const response = await httpClient('/api/v1/auth/me', {}, token);
  if (!response.ok) {
    throw new Error('Sesión no válida o expirada.');
  }
  return response.json();
}
