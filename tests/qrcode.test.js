import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQrMatrix } from '../src/utils/qrcode.js';

test('generateQrMatrix genera una matriz cuadrada booleana para texto estándar', () => {
  const text = 'gymvip:challenge:v1:a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d:abcdef1234567890';
  const matrix = generateQrMatrix(text, 'M');

  assert.ok(Array.isArray(matrix), 'La salida debe ser un array');
  assert.ok(matrix.length > 20, 'El tamaño debe ser adecuado para la longitud del texto');
  assert.equal(matrix.length, matrix[0].length, 'La matriz debe ser cuadrada');

  // Verificar que contenga booleanos (true/false)
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      assert.equal(typeof matrix[r][c], 'boolean');
    }
  }

  // Verificar finder pattern en (0,0): esquina superior izquierda debe tener módulo oscuro en (0,0) y centro oscuro
  assert.equal(matrix[0][0], true);
  assert.equal(matrix[3][3], true);
  assert.equal(matrix[0][1], true);
});
