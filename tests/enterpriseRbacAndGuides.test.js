import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, hasAnyPermission, resolveEffectivePermissions } from '../src/services/permissionsService.js';
import { STAFF_ROLES, validateStaffCreation } from '../src/validators/staffValidator.js';

test('RBAC: ADMIN y SUPER_ADMIN poseen permisos de plataforma y personal', () => {
  const superAdmin = { roles: ['SUPER_ADMIN'] };
  assert.equal(hasPermission(superAdmin, 'platform.manage'), true);
  assert.equal(hasPermission(superAdmin, 'employees.assign_role'), true);
});

test('RBAC: AUDITOR_EMPRESA solo tiene lectura y exportación, nunca cobros ni alta', () => {
  const auditor = { roles: ['AUDITOR_EMPRESA'] };
  assert.equal(hasPermission(auditor, 'reports.read'), true);
  assert.equal(hasPermission(auditor, 'reports.export'), true);
  assert.equal(hasPermission(auditor, 'payments.create'), false);
  assert.equal(hasPermission(auditor, 'employees.assign_role'), false);
});

test('RBAC: ENTRENADOR puede crear y asignar rutinas sin acceder a finanzas ni personal', () => {
  const coach = { roles: ['ENTRENADOR'] };
  assert.equal(hasAnyPermission(coach, ['training.routines.create', 'training.routines.assign']), true);
  assert.equal(hasPermission(coach, 'payments.create'), false);
  assert.equal(hasPermission(coach, 'employees.create'), false);
});

test('Validator: catálogo de roles staff soporta jerarquía enterprise y valida entradas', () => {
  assert.ok(STAFF_ROLES.some((r) => r.value === 'SUPER_ADMIN'));
  assert.ok(STAFF_ROLES.some((r) => r.value === 'ENTRENADOR'));
  assert.deepEqual(validateStaffCreation('coach@vipcenterfit.pe', 'ClaveSegura123', 'ENTRENADOR'), []);
  assert.ok(validateStaffCreation('', '123', 'DESCONOCIDO').length >= 3);
  assert.ok(resolveEffectivePermissions({ roles: ['RECEPCION'] }).includes('attendance.manage'));
});
