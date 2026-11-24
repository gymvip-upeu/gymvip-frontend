import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDocument,
  validatePhonePeru,
  validateEmail,
  validatePersonName,
  validateAmountPen,
  validateDateRange,
  validatePasswordSecurity,
  sanitizeInput,
} from '../src/validators/dataValidator.js';

test('validateDocument validates Peruvian DNI strictly (8 digits)', () => {
  assert.equal(validateDocument('DNI', '72345678').isValid, true);
  assert.equal(validateDocument('DNI', '1234567').isValid, false);
  assert.equal(validateDocument('DNI', '123456789').isValid, false);
  assert.equal(validateDocument('DNI', '7234567A').isValid, false);
  assert.equal(validateDocument('DNI', '').isValid, false);
});

test('validateDocument validates CE (9-12 alphanumeric characters)', () => {
  assert.equal(validateDocument('CE', '001234567').isValid, true);
  assert.equal(validateDocument('CE', 'ABC123456789').isValid, true);
  assert.equal(validateDocument('CE', '12345678').isValid, false); // only 8 chars
  assert.equal(validateDocument('CE', '1234567890123').isValid, false); // 13 chars
});

test('validatePhonePeru validates Peruvian mobile phones (9 digits starting with 9)', () => {
  assert.equal(validatePhonePeru('987654321').isValid, true);
  assert.equal(validatePhonePeru('+51 987654321').isValid, true);
  assert.equal(validatePhonePeru('51987654321').isValid, true);
  assert.equal(validatePhonePeru('887654321').isValid, false); // does not start with 9
  assert.equal(validatePhonePeru('98765432').isValid, false); // only 8 digits
  assert.equal(validatePhonePeru('', false).isValid, true); // optional phone
  assert.equal(validatePhonePeru('', true).isValid, false); // required phone
});

test('validateEmail validates RFC 5322 format', () => {
  assert.equal(validateEmail('admin@vipcenterfit.pe').isValid, true);
  assert.equal(validateEmail('socio.vip@gmail.com').isValid, true);
  assert.equal(validateEmail('invalid-email').isValid, false);
  assert.equal(validateEmail('@no-user.com').isValid, false);
  assert.equal(validateEmail('user@').isValid, false);
});

test('validatePersonName validates clean names and prevents XSS injections', () => {
  assert.equal(validatePersonName('Jorge Acosta').isValid, true);
  assert.equal(validatePersonName('María José Peña-Gómez').isValid, true);
  assert.equal(validatePersonName('<script>alert(1)</script>').isValid, false);
  assert.equal(validatePersonName('Carlos <iframe src="...">').isValid, false);
  assert.equal(validatePersonName('A').isValid, false); // < 2 characters
});

test('validateAmountPen validates currency in Soles (PEN)', () => {
  assert.equal(validateAmountPen(150.00).isValid, true);
  assert.equal(validateAmountPen('89.90').isValid, true);
  assert.equal(validateAmountPen(0).isValid, false);
  assert.equal(validateAmountPen(-10).isValid, false);
  assert.equal(validateAmountPen('45.999').isValid, false); // more than 2 decimals
});

test('validateDateRange validates coherence between start and end dates', () => {
  assert.equal(validateDateRange('2026-01-01', '2026-01-31').isValid, true);
  assert.equal(validateDateRange('2026-05-10', '2026-05-10').isValid, true);
  assert.equal(validateDateRange('2026-02-15', '2026-02-01').isValid, false);
  assert.equal(validateDateRange('', '2026-02-01').isValid, false);
});

test('validatePasswordSecurity requires minimum complexity', () => {
  assert.equal(validatePasswordSecurity('VipCenter2026!').isValid, true);
  assert.equal(validatePasswordSecurity('weak').isValid, false);
  assert.equal(validatePasswordSecurity('alllowercase1').isValid, false); // no uppercase
  assert.equal(validatePasswordSecurity('ALLUPPERCASE1').isValid, false); // no lowercase
  assert.equal(validatePasswordSecurity('NoNumbersHere!').isValid, false); // no numbers
});

test('sanitizeInput strips dangerous HTML and script tags', () => {
  assert.equal(sanitizeInput('Hola <b>Mundo</b>'), 'Hola Mundo');
  assert.equal(sanitizeInput('<script>hack()</script>Texto'), 'Texto');
});
