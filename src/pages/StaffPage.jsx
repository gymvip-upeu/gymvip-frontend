// ==============================================================================
// GYM VIP — Pantalla: StaffPage (Personal y Control de Roles - HU-04)
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { formatDate } from '../utils/formatters';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icons';
import { LoadingState, EmptyState } from '../components/feedback/LoadingState';
import StaffModal from '../components/modals/StaffModal';

export default function StaffPage() {
  const { token, isAdmin, user } = useAuth();
  const {
    accounts,
    loading,
    error,
    setError,
    successToast,
    setSuccessToast,
    actionSubmitting,
    loadAccounts,
    updateRole,
    inactivateAccount,
  } = useStaff(token, isAdmin());

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoleAccount, setEditingRoleAccount] = useState(null);
  const [selectedRole, setSelectedRole] = useState('RECEPCION');
  const [confirmInactivateAccount, setConfirmInactivateAccount] = useState(null);

  if (!isAdmin()) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ color: 'var(--color-gold)', marginBottom: '14px' }}>
          <Icon name="shield-check" size={48} />
        </div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '12px 0 6px 0', color: 'var(--color-text-primary)' }}>
          Acceso Restringido (HTTP 403)
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: '0 auto' }}>
          La administración de personal, asignación de roles y control de cuentas requiere credenciales de Administrador (HU-04).
        </p>
      </div>
    );
  }

  const handleCreateSuccess = (newAccount) => {
    setIsCreateOpen(false);
    setSuccessToast(`¡Cuenta de personal "${newAccount.email}" creada con éxito!`);
    loadAccounts();
  };

  const handleUpdateRole = async () => {
    if (!editingRoleAccount) return;
    await updateRole(editingRoleAccount.id, selectedRole, editingRoleAccount.email);
    setEditingRoleAccount(null);
  };

  const handleConfirmInactivate = async () => {
    if (!confirmInactivateAccount) return;
    await inactivateAccount(confirmInactivateAccount);
    setConfirmInactivateAccount(null);
  };

  return (
    <div className="staff-page" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
            Nómina de Personal y Roles
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            HU-04: Gestión de colaboradores, asignación de roles ADMIN/RECEPCION y protección del último administrador.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          style={{ minHeight: '44px', fontSize: '14px' }}
        >
          <Icon name="plus" size={16} />
          <span>Nuevo Colaborador</span>
        </Button>
      </div>

      {successToast && (
        <Alert
          variant="success"
          message={successToast}
          onClose={() => setSuccessToast(null)}
        />
      )}

      {error && (
        <Alert
          variant="danger"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Nómina de Personal */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingState message="Consultando nómina de colaboradores..." />
        ) : accounts.length === 0 ? (
          <EmptyState
            title="No hay cuentas registradas"
            subtitle="Presiona 'Nuevo Colaborador' para añadir personal al sistema."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Rol Asignado</th>
                  <th>Estado de Acceso</th>
                  <th>Fecha de Alta</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => {
                  const isCurrent = user && user.email === acc.email;
                  const isActive = acc.status === 'ACTIVO';
                  const roleName = acc.roles && acc.roles.length > 0 ? acc.roles[0] : 'RECEPCION';
                  const initial = acc.email ? acc.email.charAt(0).toUpperCase() : 'C';

                  return (
                    <tr key={acc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--color-surface-elevated)',
                              border: '1px solid var(--color-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: roleName === 'ADMIN' ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                              flexShrink: 0,
                            }}
                            aria-hidden="true"
                          >
                            {initial}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{acc.email}</strong>
                            {isCurrent && (
                              <Badge variant="gold" style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px' }}>
                                Tu Sesión
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={roleName === 'ADMIN' ? 'gold' : 'neutral'}>
                          {roleName}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={isActive ? 'success' : 'neutral'}>
                          {acc.status}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {formatDate(acc.createdAt)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingRoleAccount(acc);
                              setSelectedRole(roleName);
                            }}
                            style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px' }}
                            disabled={!isActive}
                          >
                            <Icon name="refresh" size={13} />
                            <span>Cambiar Rol</span>
                          </Button>
                          {isActive && (
                            <Button
                              variant="secondary"
                              onClick={() => setConfirmInactivateAccount(acc)}
                              style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px', color: 'var(--color-danger)' }}
                            >
                              Inactivar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Colaborador */}
      {isCreateOpen && (
        <StaffModal
          token={token}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Modal Modificar Rol */}
      {editingRoleAccount && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '28px' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 12px 0' }}>
              Modificar Rol Operativo
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              Colaborador: <strong>{editingRoleAccount.email}</strong>
            </p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="edit-role-select">
                Seleccionar Nuevo Rol
              </label>
              <select
                id="edit-role-select"
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="ADMIN">ADMIN (Control Total del Sistema)</option>
                <option value="RECEPCION">RECEPCION (Atención y Cobros)</option>
              </select>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
              Nota: El sistema no permitirá degradar al último Administrador activo para evitar bloqueos del sistema (salvaguarda transaccional HTTP 409).
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="secondary"
                onClick={() => setEditingRoleAccount(null)}
                disabled={actionSubmitting}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateRole}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? 'Guardando...' : 'Actualizar Rol'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Inactivación */}
      {confirmInactivateAccount && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '28px' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 12px 0' }}>
              Confirmar Inactivación de Cuenta
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas revocar el acceso a <strong>"{confirmInactivateAccount.email}"</strong>?
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '10px' }}>
              Se revocarán todas sus sesiones activas de manera inmediata. Esta acción queda registrada en el libro de auditoría.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button
                variant="secondary"
                onClick={() => setConfirmInactivateAccount(null)}
                disabled={actionSubmitting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmInactivate}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? 'Inactivando...' : 'Inactivar Cuenta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
