// ==============================================================================
// GYM VIP — Pruebas Automatizadas de Rutas SPA y Mapeos de Navegación
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { PATH_VIEW_MAP, VIEW_PATH_MAP, resolveViewFromPath } from '../src/routes/routeConfig.js';

test('Routing: resuelve correctamente las rutas visibles del frontend a sus vistas', () => {
  assert.equal(resolveViewFromPath('/'), 'home');
  assert.equal(resolveViewFromPath('/inicio'), 'home');
  assert.equal(resolveViewFromPath('/home'), 'home');
  assert.equal(resolveViewFromPath('/miembros'), 'clients');
  assert.equal(resolveViewFromPath('/miembros/importar'), 'clients');
  assert.equal(resolveViewFromPath('/planes'), 'plans');
  assert.equal(resolveViewFromPath('/vigencias'), 'coverage');
  assert.equal(resolveViewFromPath('/verificacion'), 'verification');
  assert.equal(resolveViewFromPath('/cobros'), 'memberships');
  assert.equal(resolveViewFromPath('/membresias'), 'memberships');
  assert.equal(resolveViewFromPath('/personal'), 'staff');
  assert.equal(resolveViewFromPath('/configuracion'), 'settings');
});

test('Routing: rutas con mayúsculas y trailing slashes se normalizan de forma tolerante', () => {
  assert.equal(resolveViewFromPath('/MIEMBROS/'), 'clients');
  assert.equal(resolveViewFromPath('/PLANES'), 'plans');
  assert.equal(resolveViewFromPath('/Vigencias/'), 'coverage');
  assert.equal(resolveViewFromPath('/Cobros/'), 'memberships');
});

test('Routing: rutas desconocidas o nulas resuelven de forma segura a home', () => {
  assert.equal(resolveViewFromPath('/ruta-inexistente'), 'home');
  assert.equal(resolveViewFromPath('/admin/desconocido'), 'home');
  assert.equal(resolveViewFromPath(''), 'home');
  assert.equal(resolveViewFromPath(null), 'home');
  assert.equal(resolveViewFromPath(undefined), 'home');
});

test('Routing: VIEW_PATH_MAP contiene correspondencia estricta para cada vista operativa', () => {
  const views = ['home', 'clients', 'plans', 'coverage', 'verification', 'memberships', 'staff', 'settings'];
  for (const v of views) {
    assert.ok(VIEW_PATH_MAP[v], `Debe existir ruta asignada para vista: ${v}`);
    assert.ok(VIEW_PATH_MAP[v].startsWith('/'), `La ruta de ${v} debe comenzar con /`);
    // Ninguna ruta visible del frontend debe colisionar con endpoints backend /api/v1
    assert.ok(!VIEW_PATH_MAP[v].startsWith('/api/'), `La ruta ${VIEW_PATH_MAP[v]} no debe colisionar con /api/`);
  }
});
