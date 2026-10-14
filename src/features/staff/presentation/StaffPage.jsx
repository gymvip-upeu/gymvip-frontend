import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { listAccountsApi, updateAccountRoleApi, inactivateAccountApi } from '../infrastructure/staffApi';
import StaffModal from './StaffModal';

export default function StaffPage() {
  const { token, isAdmin, user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoleAccount, setEditingRoleAccount] = useState(null);
  const [selectedRole, setSelectedRole] = useState('RECEPCION');
  const [confirmInactivateAccount, setConfirmInactivateAccount] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAccountsApi(token);
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      loadAccounts();
    }
  }, [token]);

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
    setActionSubmitting(true);
    setError(null);
    try {
      await updateAccountRoleApi(editingRoleAccount.id, selectedRole, token);
      setSuccessToast(`Rol de "${editingRoleAccount.email}" actualizado a ${selectedRole}.`);
      setEditingRoleAccount(null);
      loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleInactivate = async () => {
    if (!confirmInactivateAccount) return;
    setActionSubmitting(true);
    setError(null);
    try {
      await inactivateAccountApi(confirmInactivateAccount.id, token);
      setSuccessToast(`Cuenta de "${confirmInactivateAccount.email}" ha sido inactivada.`);
      setConfirmInactivateAccount(null);
      loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionSubmitting(false);
    }
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

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateOpen(true)}
          style={{ minHeight: '42px', fontSize: '14px' }}
        >
          ➕ Nuevo Colaborador
        </button>
      </div>

      {successToast && (
        <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✓ {successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Nómina de Personal */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p>Consultando nómina de colaboradores...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>No hay cuentas registradas</p>
          </div>
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
                          <span className="badge badge-gold" style={{ marginLeft: '8px', fontSize: '10px' }}>
                            Tu Cuenta
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${roleName === 'ADMIN' ? 'badge-gold' : 'badge-neutral'}`}>
                          {roleName}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {acc.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('es-PE') : '-'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setEditingRoleAccount(acc);
                              setSelectedRole(roleName);
                            }}
                            style={{ fontSize: '12px', padding: '6px 10px', minHeight: '32px' }}
                            disabled={!isActive}
                          >
                            🔄 Rol
                          </button>
                          {isActive && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setConfirmInactivateAccount(acc)}
                              style={{ fontSize: '12px', padding: '6px 10px', minHeight: '32px', color: 'var(--color-danger)' }}
                            >
                              Inactivar
                            </button>
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
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingRoleAccount(null)}
                disabled={actionSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdateRole}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? 'Guardando...' : 'Actualizar Rol'}
              </button>
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
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmInactivateAccount(null)}
                disabled={actionSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: '#FFFFFF' }}
                onClick={handleInactivate}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? 'Inactivando...' : 'Inactivar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
