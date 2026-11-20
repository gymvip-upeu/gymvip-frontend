import test from 'node:test';
import assert from 'node:assert/strict';
import { channelStatusLabel, projectChannels } from '../src/services/channelStatus.js';

test('El reporte distingue configuración, simulación y falta de verificación sin afirmar entrega', () => {
  assert.equal(channelStatusLabel('CONFIGURED_REAL'), 'Configurado para envío real');
  assert.equal(channelStatusLabel('SIMULATION'), 'Simulación · sin envío real');
  assert.equal(channelStatusLabel('UNCONFIGURED'), 'Pendiente de configuración');
  assert.equal(channelStatusLabel('UNVERIFIED'), 'No se pudo verificar');
  assert.equal(channelStatusLabel('unexpected'), 'No se pudo verificar');
  assert.equal(channelStatusLabel('DISABLED'), 'Desactivado');
  assert.deepEqual(projectChannels, ['WHATSAPP','APP']);
});
