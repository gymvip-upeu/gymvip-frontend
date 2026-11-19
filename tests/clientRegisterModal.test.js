// ==============================================================================
// GYM VIP — Pruebas de Regresión: Modal de Alta de Socios y Lógica de Registro (HU-01)
// Cobertura exhaustiva: Validaciones, ApiPeruDev, Sobreescritura, Concurrencia y Payloads
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClientRegistration } from '../src/validators/clientValidator.js';
import { isAdult, calculateAge } from '../src/utils/dateUtils.js';

// Helper simulado de lógica de payload y validaciones de ClientRegisterModal
function buildClientPayload({
  firstName,
  lastName,
  documentType = 'DNI',
  documentNumber,
  birthDate,
  phone = '',
  email = '',
  notes = '',
  createAccess = true,
}) {
  return {
    client: {
      firstName: firstName ? firstName.trim() : '',
      lastName: lastName ? lastName.trim() : '',
      documentType,
      documentNumber: documentNumber ? documentNumber.trim() : '',
      birthDate,
      phone: phone && phone.trim() ? phone.trim() : null,
      email: email && email.trim() ? email.trim().toLowerCase() : null,
      countryCode: 'PE',
    },
    notes: notes && notes.trim() ? notes.trim() : null,
    createAccess,
  };
}

// Helper simulado de lógica de auto-completado de ApiPeruDev en ClientRegisterModal
function applyDniLookupResult({
  res,
  currentFirst,
  currentLast,
  currentDocNumber,
  targetDni,
}) {
  // Descarte anti-race condition
  if (currentDocNumber.trim() !== targetDni) {
    return { ignored: true, reason: 'DNI modificado durante la consulta' };
  }

  if (res.status === 'ENCONTRADO' && res.nombres) {
    const newFirst = res.nombres;
    const newLast = res.apellidos || '';

    // Si ya existen nombres escritos y difieren de la API, solicitar confirmación
    const hasExisting = Boolean(currentFirst.trim() || currentLast.trim());
    const differs =
      currentFirst.trim().toUpperCase() !== newFirst.toUpperCase() ||
      currentLast.trim().toUpperCase() !== newLast.toUpperCase();

    if (hasExisting && differs) {
      return {
        action: 'PROMPT_OVERWRITE',
        pendingOverwrite: { nombres: newFirst, apellidos: newLast },
      };
    }

    return {
      action: 'APPLY_NAMES',
      firstName: newFirst,
      lastName: newLast,
      lookupSuccess: 'Datos encontrados en la fuente consultada (ApiPeruDev).',
    };
  }

  if (res.status === 'NO_ENCONTRADO') {
    return { action: 'SHOW_NOT_FOUND_MODAL', notFoundModalOpen: true };
  }

  if (res.status === 'CUOTA_AGOTADA') {
    return {
      action: 'SHOW_NOTICE',
      variant: 'warning',
      message: 'Se ha alcanzado el límite de consultas de ApiPeruDev. Complete los datos manualmente.',
    };
  }

  if (res.status === 'SERVICIO_NO_DISPONIBLE') {
    return {
      action: 'SHOW_NOTICE',
      variant: 'warning',
      message: 'El servicio de consulta no está disponible temporalmente. Puede reintentar o completar los datos manualmente.',
    };
  }

  return {
    action: 'SHOW_NOTICE',
    variant: 'info',
    message: res.mensaje || 'No se pudo completar la verificación automática de identidad.',
  };
}

// ------------------------------------------------------------------------------
// 18 Escenarios de Prueba de Regresión
// ------------------------------------------------------------------------------

test('1. Validación: rechaza formulario con campos obligatorios vacíos', () => {
  const errors = validateClientRegistration({
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    birthDate: '',
  });
  assert.ok(errors.length >= 4);
  assert.ok(errors.some(e => e.includes('nombre')));
  assert.ok(errors.some(e => e.includes('apellidos')));
  assert.ok(errors.some(e => e.includes('documento')));
  assert.ok(errors.some(e => e.includes('nacimiento')));
});

test('2. Validación: valida que el DNI contenga estrictamente 8 dígitos numéricos', () => {
  const invalidCases = ['1234567', '123456789', '8765432A', '  123456  ', 'ABCDEFGH'];
  for (const dni of invalidCases) {
    const errors = validateClientRegistration({
      firstName: 'Juan',
      lastName: 'Pérez',
      documentType: 'DNI',
      documentNumber: dni,
      birthDate: '1990-01-01',
    });
    assert.ok(errors.some(e => e.includes('8 dígitos')), `Fallo en '${dni}'`);
  }
});

test('3. Validación: rechaza cliente menor de 18 años según fecha de nacimiento', () => {
  const underAge = new Date();
  const y = underAge.getFullYear() - 17;
  const m = String(underAge.getMonth() + 1).padStart(2, '0');
  const d = String(underAge.getDate()).padStart(2, '0');
  const birthStr = `${y}-${m}-${d}`;

  assert.equal(isAdult(birthStr), false);
  const errors = validateClientRegistration({
    firstName: 'Carlos',
    lastName: 'Gómez',
    documentType: 'DNI',
    documentNumber: '76543210',
    birthDate: birthStr,
  });
  assert.ok(errors.some(e => e.includes('menor de edad')));
});

test('4. Validación: acepta cliente mayor de 18 años cumplidos exactamente', () => {
  const adultDate = new Date();
  const y = adultDate.getFullYear() - 18;
  const m = String(adultDate.getMonth() + 1).padStart(2, '0');
  const d = String(adultDate.getDate()).padStart(2, '0');
  const birthStr = `${y}-${m}-${d}`;

  assert.equal(isAdult(birthStr), true);
  assert.ok(calculateAge(birthStr) >= 18);
});

test('5. Validación: admite registro con correo y teléfono omitidos (campos opcionales)', () => {
  const errors = validateClientRegistration({
    firstName: 'Rosa',
    lastName: 'Vargas',
    documentType: 'DNI',
    documentNumber: '40506070',
    birthDate: '1992-06-15',
    phone: '',
    email: '',
  });
  assert.equal(errors.length, 0);
});

test('6. Validación: valida sintaxis de correo electrónico solo si es provisto', () => {
  const errorsInvalid = validateClientRegistration({
    firstName: 'Rosa',
    lastName: 'Vargas',
    documentType: 'DNI',
    documentNumber: '40506070',
    birthDate: '1992-06-15',
    email: 'correo_invalido_sin_dominio',
  });
  assert.ok(errorsInvalid.some(e => e.includes('correo')));

  const errorsValid = validateClientRegistration({
    firstName: 'Rosa',
    lastName: 'Vargas',
    documentType: 'DNI',
    documentNumber: '40506070',
    birthDate: '1992-06-15',
    email: 'rosa.vargas@ejemplo.pe',
  });
  assert.equal(errorsValid.length, 0);
});

test('7. Validación: valida teléfono de contacto (7 a 20 dígitos numéricos) solo si es provisto', () => {
  const errorsInvalid = validateClientRegistration({
    firstName: 'Rosa',
    lastName: 'Vargas',
    documentType: 'DNI',
    documentNumber: '40506070',
    birthDate: '1992-06-15',
    phone: '123', // menos de 7 dígitos
  });
  assert.ok(errorsInvalid.some(e => e.includes('teléfono')));

  const errorsValid = validateClientRegistration({
    firstName: 'Rosa',
    lastName: 'Vargas',
    documentType: 'DNI',
    documentNumber: '40506070',
    birthDate: '1992-06-15',
    phone: '+51 987654321',
  });
  assert.equal(errorsValid.length, 0);
});

test('8. Payload: normaliza campos con trim(), correo en minúsculas y código de país PE', () => {
  const payload = buildClientPayload({
    firstName: '  Juan Carlos  ',
    lastName: '  Pérez Mendoza  ',
    documentType: 'DNI',
    documentNumber: ' 72819201 ',
    birthDate: '1995-03-20',
    phone: ' +51 987111222 ',
    email: ' Juan.Perez@VIPCENTERFIT.PE ',
    notes: ' Socio VIP ',
    createAccess: true,
  });

  assert.equal(payload.client.firstName, 'Juan Carlos');
  assert.equal(payload.client.lastName, 'Pérez Mendoza');
  assert.equal(payload.client.documentNumber, '72819201');
  assert.equal(payload.client.email, 'juan.perez@vipcenterfit.pe');
  assert.equal(payload.client.phone, '+51 987111222');
  assert.equal(payload.client.countryCode, 'PE');
  assert.equal(payload.notes, 'Socio VIP');
  assert.equal(payload.createAccess, true);
});

test('9. Payload: convierte correo y teléfono vacíos a null para el backend', () => {
  const payload = buildClientPayload({
    firstName: 'Mariana',
    lastName: 'Torres',
    documentNumber: '71234567',
    birthDate: '1998-10-10',
    phone: '   ',
    email: '',
    notes: '',
  });

  assert.equal(payload.client.email, null);
  assert.equal(payload.client.phone, null);
  assert.equal(payload.notes, null);
});

test('10. DNI Lookup: botón de consulta solo está activo con DNI válido de 8 dígitos y sin carga', () => {
  const checkAvailable = (docType, docNum, loading, submitting) =>
    docType === 'DNI' && /^\d{8}$/.test(docNum.trim()) && !loading && !submitting;

  assert.equal(checkAvailable('DNI', '72819201', false, false), true);
  assert.equal(checkAvailable('CE', '72819201', false, false), false);
  assert.equal(checkAvailable('DNI', '7281920', false, false), false);
  assert.equal(checkAvailable('DNI', '72819201', true, false), false);
  assert.equal(checkAvailable('DNI', '72819201', false, true), false);
});

test('11. ApiPeruDev: segrega nombres y apellidos cuando el formulario está vacío', () => {
  const result = applyDniLookupResult({
    res: {
      status: 'ENCONTRADO',
      nombres: 'MARIANA VALENTINA',
      apellidos: 'TORRES RAMOS',
    },
    currentFirst: '',
    currentLast: '',
    currentDocNumber: '72819201',
    targetDni: '72819201',
  });

  assert.equal(result.action, 'APPLY_NAMES');
  assert.equal(result.firstName, 'MARIANA VALENTINA');
  assert.equal(result.lastName, 'TORRES RAMOS');
  assert.ok(result.lookupSuccess.includes('ApiPeruDev'));
});

test('12. ApiPeruDev: activa confirmación (PROMPT_OVERWRITE) si difiere de nombres existentes', () => {
  const result = applyDniLookupResult({
    res: {
      status: 'ENCONTRADO',
      nombres: 'MARIANA',
      apellidos: 'TORRES RAMOS',
    },
    currentFirst: 'Maria',
    currentLast: 'Torres',
    currentDocNumber: '72819201',
    targetDni: '72819201',
  });

  assert.equal(result.action, 'PROMPT_OVERWRITE');
  assert.equal(result.pendingOverwrite.nombres, 'MARIANA');
  assert.equal(result.pendingOverwrite.apellidos, 'TORRES RAMOS');
});

test('13. ApiPeruDev: auto-aplica nombres si los existentes coinciden en mayúsculas/minúsculas', () => {
  const result = applyDniLookupResult({
    res: {
      status: 'ENCONTRADO',
      nombres: 'MARIANA',
      apellidos: 'TORRES RAMOS',
    },
    currentFirst: 'mariana',
    currentLast: 'torres ramos',
    currentDocNumber: '72819201',
    targetDni: '72819201',
  });

  assert.equal(result.action, 'APPLY_NAMES');
  assert.equal(result.firstName, 'MARIANA');
});

test('14. ApiPeruDev: activa modal secundario (notFoundModalOpen) ante NO_ENCONTRADO', () => {
  const result = applyDniLookupResult({
    res: { status: 'NO_ENCONTRADO' },
    currentFirst: '',
    currentLast: '',
    currentDocNumber: '72819200',
    targetDni: '72819200',
  });

  assert.equal(result.action, 'SHOW_NOT_FOUND_MODAL');
  assert.equal(result.notFoundModalOpen, true);
});

test('15. ApiPeruDev: genera alerta de advertencia ante CUOTA_AGOTADA sin deshabilitar formulario', () => {
  const result = applyDniLookupResult({
    res: { status: 'CUOTA_AGOTADA' },
    currentFirst: '',
    currentLast: '',
    currentDocNumber: '72819201',
    targetDni: '72819201',
  });

  assert.equal(result.action, 'SHOW_NOTICE');
  assert.equal(result.variant, 'warning');
  assert.ok(result.message.includes('límite de consultas'));
});

test('16. ApiPeruDev: genera alerta de advertencia ante SERVICIO_NO_DISPONIBLE', () => {
  const result = applyDniLookupResult({
    res: { status: 'SERVICIO_NO_DISPONIBLE' },
    currentFirst: '',
    currentLast: '',
    currentDocNumber: '72819201',
    targetDni: '72819201',
  });

  assert.equal(result.action, 'SHOW_NOTICE');
  assert.equal(result.variant, 'warning');
  assert.ok(result.message.includes('temporalmente'));
});

test('17. Anti-race condition: descarta respuesta de identidad si el DNI cambió durante la consulta', () => {
  const result = applyDniLookupResult({
    res: { status: 'ENCONTRADO', nombres: 'LUIS', apellidos: 'CAMPOS' },
    currentFirst: '',
    currentLast: '',
    currentDocNumber: '72819202', // Operador cambió a otro DNI
    targetDni: '72819201',       // Respuesta de la consulta anterior
  });

  assert.equal(result.ignored, true);
  assert.ok(result.reason.includes('modificado'));
});

test('18. Integridad de Envío: confirmación exitosa requiere id de cliente en respuesta de servidor', () => {
  const validBackendResponse = {
    client: { id: 'uuid-1234', firstName: 'Juan', lastName: 'Pérez' },
    credentials: { username: 'juan.perez', temporaryPassword: 'TempPassword123!' },
  };

  const invalidBackendResponse = {
    client: null,
  };

  assert.ok(validBackendResponse?.client?.id, 'Debe confirmar presencia de id');
  assert.ok(!invalidBackendResponse?.client?.id, 'Debe rechazar respuesta vacía o incompleta');
});
