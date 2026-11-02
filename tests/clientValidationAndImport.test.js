// ==============================================================================
// GYM VIP — Pruebas Automatizadas de Validación e Importación de Clientes (HU-01 / HU-06)
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClientRegistration } from '../src/validators/clientValidator.js';
import { previewClientImport, confirmClientImport } from '../src/services/clientImportService.js';

test('validateClientRegistration: campos obligatorios faltantes devuelven errores específicos', () => {
  const emptyData = {
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    birthDate: '',
  };
  const errors = validateClientRegistration(emptyData);
  assert.ok(errors.length >= 4, 'Debe reportar al menos 4 errores de campos obligatorios');
  assert.ok(errors.some(e => e.includes('nombre')));
  assert.ok(errors.some(e => e.includes('apellidos')));
  assert.ok(errors.some(e => e.includes('documento')));
  assert.ok(errors.some(e => e.includes('nacimiento')));
});

test('validateClientRegistration: rechaza clientes menores de edad (<18 años)', () => {
  const underageDate = new Date();
  underageDate.setFullYear(underageDate.getFullYear() - 17);

  const data = {
    firstName: 'Mateo',
    lastName: 'García',
    documentType: 'DNI',
    documentNumber: '78901234',
    birthDate: underageDate.toISOString().slice(0, 10),
  };

  const errors = validateClientRegistration(data);
  assert.ok(errors.some(e => e.includes('menor de edad')));
});

test('validateClientRegistration: valida que el DNI peruano contenga exactamente 8 dígitos numéricos', () => {
  const invalidDnis = ['1234567', '123456789', 'ABC12345', '1234 567'];

  for (const dni of invalidDnis) {
    const data = {
      firstName: 'Laura',
      lastName: 'Méndez',
      documentType: 'DNI',
      documentNumber: dni,
      birthDate: '1995-04-12',
    };
    const errors = validateClientRegistration(data);
    assert.ok(errors.some(e => e.includes('8 dígitos')), `DNI '${dni}' debió ser rechazado`);
  }
});

test('validateClientRegistration: admite cliente válido mayor de edad con correo y teléfono omitidos', () => {
  const data = {
    firstName: 'Alejandro',
    lastName: 'Paredes',
    documentType: 'DNI',
    documentNumber: '44556677',
    birthDate: '1990-08-20',
    phone: '',
    email: '',
  };
  const errors = validateClientRegistration(data);
  assert.equal(errors.length, 0, 'No debe arrojar errores cuando los campos opcionales están vacíos');
});

test('validateClientRegistration: valida formato de correo y teléfono cuando son ingresados', () => {
  const data = {
    firstName: 'Carmen',
    lastName: 'Salas',
    documentType: 'DNI',
    documentNumber: '71234567',
    birthDate: '1992-11-15',
    phone: 'invalido-letras',
    email: 'correo_sin_arroba_ni_dominio',
  };
  const errors = validateClientRegistration(data);
  assert.ok(errors.some(e => e.includes('teléfono')));
  assert.ok(errors.some(e => e.includes('correo')));
});

test('previewClientImport: lanza error si se invoca sin archivo', async () => {
  await assert.rejects(
    async () => {
      await previewClientImport(null, 'mock-token');
    },
    { message: 'Debe seleccionar un archivo .xlsx para validar.' }
  );
});

test('confirmClientImport: lanza error si se invoca sin archivo', async () => {
  await assert.rejects(
    async () => {
      await confirmClientImport(null, 'mock-token');
    },
    { message: 'Debe proporcionar el archivo validado para confirmar la importación.' }
  );
});

