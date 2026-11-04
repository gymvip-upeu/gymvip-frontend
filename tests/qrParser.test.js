// ==============================================================================
// GYM VIP — Pruebas Automatizadas del Validador QR (HU-13 T05 / T13 / Sprint 3)
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQrPayload } from '../src/utils/qrParser.js';

test('parseQrPayload: reconoce código directo de miembro MAR-XXXXXX', () => {
  const result = parseQrPayload('MAR-2B7A89');
  assert.equal(result.valid, true);
  assert.equal(result.identifier, 'MAR-2B7A89');
  assert.equal(result.type, 'MEMBER_CODE');
});

test('parseQrPayload: reconoce código de miembro en minúsculas y normaliza a mayúsculas', () => {
  const result = parseQrPayload('  mar-123abc  ');
  assert.equal(result.valid, true);
  assert.equal(result.identifier, 'MAR-123ABC');
  assert.equal(result.type, 'MEMBER_CODE');
});

test('parseQrPayload: reconoce identificador UUID directo', () => {
  const uuid = 'e1f0b09e-7164-42f8-b3bf-4d10ba35f7e1';
  const result = parseQrPayload(uuid);
  assert.equal(result.valid, true);
  assert.equal(result.identifier, uuid);
  assert.equal(result.type, 'CLIENT_ID');
});

test('parseQrPayload: reconoce token QR dinámico de acceso móvil (HU-13 Sprint 3 KMP)', () => {
  const dynamicQr = 'gymvip://access/v1?cid=e1f0b09e-7164-42f8-b3bf-4d10ba35f7e1&code=MAR-2B7A89&nonce=a1b2c3d4&exp=1793750000';
  const result = parseQrPayload(dynamicQr);
  assert.equal(result.valid, true);
  assert.equal(result.identifier, 'e1f0b09e-7164-42f8-b3bf-4d10ba35f7e1');
  assert.equal(result.type, 'CLIENT_ID');
  assert.equal(result.token, dynamicQr);
});

test('parseQrPayload: reconoce esquema URI gymvip://member/', () => {
  const result1 = parseQrPayload('gymvip://member/MAR-999888');
  assert.equal(result1.valid, true);
  assert.equal(result1.identifier, 'MAR-999888');
  assert.equal(result1.type, 'MEMBER_CODE');

  const uuid = 'a2b3c4d5-e6f7-8901-2345-6789abcdef01';
  const result2 = parseQrPayload(`gymvip://member/${uuid}`);
  assert.equal(result2.valid, true);
  assert.equal(result2.identifier, uuid);
  assert.equal(result2.type, 'CLIENT_ID');
});

test('parseQrPayload: reconoce objetos JSON con memberCode o memberId', () => {
  const jsonCode = JSON.stringify({ memberCode: 'MAR-555AAA', gym: 'VIP Center Fit' });
  const result1 = parseQrPayload(jsonCode);
  assert.equal(result1.valid, true);
  assert.equal(result1.identifier, 'MAR-555AAA');
  assert.equal(result1.type, 'MEMBER_CODE');

  const uuid = 'b2c3d4e5-f6a7-8901-2345-6789abcdef02';
  const jsonId = JSON.stringify({ memberId: uuid });
  const result2 = parseQrPayload(jsonId);
  assert.equal(result2.valid, true);
  assert.equal(result2.identifier, uuid);
  assert.equal(result2.type, 'CLIENT_ID');
});

test('parseQrPayload: rechaza cadenas vacías, nulos o tipos no string', () => {
  assert.equal(parseQrPayload(null).valid, false);
  assert.equal(parseQrPayload(undefined).valid, false);
  assert.equal(parseQrPayload('').valid, false);
  assert.equal(parseQrPayload('   ').valid, false);
  assert.equal(parseQrPayload(12345).valid, false);
});

test('parseQrPayload: rechaza formatos desconocidos, URLs ajenas y payloads arbitrarios', () => {
  const invalid1 = parseQrPayload('https://vipcenterfit.pe/promo');
  assert.equal(invalid1.valid, false);
  assert.ok(invalid1.error.includes('no reconocido'));

  const invalid2 = parseQrPayload('MAR-12345'); // Menos de 6 caracteres tras MAR-
  assert.equal(invalid2.valid, false);

  const invalid3 = parseQrPayload('gymvip://member/INVALID');
  assert.equal(invalid3.valid, false);
  assert.ok(invalid3.error.includes('inválido'));

  const invalid4 = parseQrPayload('{"randomKey": "randomValue"}');
  assert.equal(invalid4.valid, false);
});
