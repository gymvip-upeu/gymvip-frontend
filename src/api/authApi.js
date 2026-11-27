// ==============================================================================
// GYM VIP — API de Autenticación y Sesión
// ==============================================================================

import { httpClient } from './httpClient.js';

export async function loginApi(email, password) {
  const response = await httpClient('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function verifyMfaLoginApi(challengeToken, code) {
  const response = await httpClient('/api/v1/auth/mfa/verify-login', {
    method: 'POST',
    body: JSON.stringify({ challengeToken, code }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function logoutApi(token) {
  if (!token) return;
  try {
    await httpClient('/api/v1/auth/logout', { method: 'POST', keepalive: true }, token);
  } catch {
    // Silencio en logout local ante fallos de red
  }
}

export async function getCurrentUserApi(token) {
  const response = await httpClient('/api/v1/auth/me', {}, token);
  if (!response.ok) {
    throw new Error('Sesión no válida o expirada.');
  }
  return response.json();
}

export async function updateCurrentUserApi(payload, token) {
  const response = await httpClient('/api/v1/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron actualizar tus datos personales.');
  }
  return response.json();
}
