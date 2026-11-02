// ==============================================================================
// GYM VIP — Pruebas Automatizadas de Preferencias Visuales y Temas (WCAG / Apariencia)
// Verifica persistencia en localStorage por cuenta e integridad de saneamiento
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

// Mock de localStorage para entorno Node.js
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new LocalStorageMock();

function getStorageKey(email) {
  if (email && typeof email === 'string') {
    return `gymvip_ui_preferences_${email.trim().toLowerCase()}`;
  }
  return 'gymvip_ui_preferences_default';
}

function sanitizePreferences(raw) {
  const DEFAULT = { theme: 'dark', fontSize: 'normal', reducedMotion: 'system' };
  if (!raw || typeof raw !== 'object') return DEFAULT;
  return {
    theme: ['dark', 'light', 'system'].includes(raw.theme) ? raw.theme : DEFAULT.theme,
    fontSize: ['normal', 'large'].includes(raw.fontSize) ? raw.fontSize : DEFAULT.fontSize,
    reducedMotion: ['system', 'reduce', 'normal'].includes(raw.reducedMotion) ? raw.reducedMotion : DEFAULT.reducedMotion,
  };
}

test('ThemePreferences: almacena y recupera preferencias por cuenta de correo', () => {
  localStorage.clear();
  const adminEmail = 'admin@vipcenterfit.pe';
  const recepcionEmail = 'recepcion@vipcenterfit.pe';

  // Guardar preferencia para ADMIN (tema claro, fuente grande)
  const adminPrefs = { theme: 'light', fontSize: 'large', reducedMotion: 'normal' };
  localStorage.setItem(getStorageKey(adminEmail), JSON.stringify(adminPrefs));

  // Guardar preferencia para RECEPCION (tema oscuro, fuente normal, reduce)
  const recepcionPrefs = { theme: 'dark', fontSize: 'normal', reducedMotion: 'reduce' };
  localStorage.setItem(getStorageKey(recepcionEmail), JSON.stringify(recepcionPrefs));

  // Comprobar aislamiento por cuenta
  const loadedAdmin = sanitizePreferences(JSON.parse(localStorage.getItem(getStorageKey(adminEmail))));
  const loadedRecepcion = sanitizePreferences(JSON.parse(localStorage.getItem(getStorageKey(recepcionEmail))));

  assert.equal(loadedAdmin.theme, 'light');
  assert.equal(loadedAdmin.fontSize, 'large');
  assert.equal(loadedRecepcion.theme, 'dark');
  assert.equal(loadedRecepcion.fontSize, 'normal');
  assert.equal(loadedRecepcion.reducedMotion, 'reduce');
});

test('ThemePreferences: sanea valores desconocidos a defaults seguros', () => {
  const invalid = { theme: 'neon-cyberpunk', fontSize: 'giant', reducedMotion: 'ultra' };
  const sanitized = sanitizePreferences(invalid);

  assert.equal(sanitized.theme, 'dark');
  assert.equal(sanitized.fontSize, 'normal');
  assert.equal(sanitized.reducedMotion, 'system');
});

test('ThemePreferences: cuenta invitado o no autenticada usa clave default sin colisionar', () => {
  const keyNull = getStorageKey(null);
  const keyUndefined = getStorageKey(undefined);
  const keyGuest = getStorageKey('');

  assert.equal(keyNull, 'gymvip_ui_preferences_default');
  assert.equal(keyUndefined, 'gymvip_ui_preferences_default');
  assert.equal(keyGuest, 'gymvip_ui_preferences_default');
});

