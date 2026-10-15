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
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <span style={{ fontSize: '36px' }}>🛡️</span>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '12px 0 6px 0' }}>
          Acceso Restringido (HTTP 403)
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: '420px', margin: '0 auto' }}>
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>
            Personal y Control de Roles
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            HU-04: Nómina de colaboradores, asignación de roles ADMIN/RECEPCION y protección del último administrador.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          style={{ minHeight: '42px', fontSize: '14px' }}
        >
          ➕ Nuevo Colaborador
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
                  <th>Colaborador (Correo)</th>
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

                  return (
                    <tr key={acc.id}>
                      <td>
                        <strong>{acc.email}</strong>
                        {isCurrent && (
                          <Badge variant="gold" style={{ marginLeft: '8px', fontSize: '10px' }}>
                            Tu Cuenta
                          </Badge>
                        )}
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
                            style={{ fontSize: '12px', padding: '6px 10px', minHeight: '32px' }}
                            disabled={!isActive}
                          >
                            🔄 Rol
                          </Button>
                          {isActive && (
                            <Button
                              variant="secondary"
                              onClick={() => setConfirmInactivateAccount(acc)}
                              style={{ fontSize: '12px', padding: '6px 10px', minHeight: '32px', color: 'var(--color-danger)' }}
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

      {/* Modal Crear */}
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
                className="form-input"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="ADMIN">ADMIN (Control Total del Sistema)</option>
                <option value="RECEPCION">RECEPCION (Socios y Planes)</option>
              </select>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              Nota: El sistema no permitirá degradar al último Administrador activo para evitar bloqueos del sistema.
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
