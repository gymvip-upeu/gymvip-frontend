import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/apiClient';

export default function StaffView() {
  const { token, isAdmin, user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [filterRole, setFilterRole] = useState('ALL');

  // Modal Crear Trabajador
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('RECEPCION');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/accounts', {}, token);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al consultar las cuentas de personal');
      }
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchAccounts();
    }
  }, [token]);

  if (!isAdmin()) {
    return (
      <div className="card state-empty">
        <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Acceso Restringido</p>
        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
          La gestión de personal y roles requiere credenciales de Administrador (HU-04).
        </p>
      </div>
    );
  }

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password.trim()) {
      setFormError('Correo y contraseña son obligatorios');
      return;
    }
    if (password.length < 8) {
      setFormError('La contraseña debe tener un mínimo de 8 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(
        '/api/v1/accounts',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            role,
          }),
        },
        token
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al registrar la cuenta de personal');
      }

      setIsCreateOpen(false);
      setEmail('');
      setPassword('');
      setRole('RECEPCION');
      setSuccessMsg('Cuenta de personal creada y asegurada exitosamente.');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchAccounts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRole = async (acc) => {
    const isCurrentlyAdmin = acc.roles?.includes('ADMIN') || acc.roles?.includes('SUPERADMIN');
    const newRole = isCurrentlyAdmin ? 'RECEPCION' : 'ADMIN';
    const confirmText = isCurrentlyAdmin
      ? `¿Está seguro de cambiar el rol de ${acc.email} a RECEPCION? Sus permisos de administración se revocarán inmediatamente.`
      : `¿Está seguro de ascender a ${acc.email} como ADMINISTRADOR? Tendrá acceso total al catálogo de planes y personal.`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await apiFetch(
        `/api/v1/accounts/${acc.id}/role`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: newRole }),
        },
        token
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'No se pudo actualizar el rol');
      }

      setSuccessMsg(`Rol de ${acc.email} actualizado a ${newRole}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchAccounts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleStatus = async (acc) => {
    const newStatus = acc.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const confirmText = newStatus === 'INACTIVO'
      ? `¿Desea inactivar la cuenta de ${acc.email}? Esto revocará todas sus sesiones activas de inmediato.`
      : `¿Desea reactivar la cuenta de ${acc.email}?`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await apiFetch(
        `/api/v1/accounts/${acc.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        },
        token
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'No se pudo cambiar el estado de la cuenta');
      }

      setSuccessMsg(`Estado de cuenta ${acc.email} cambiado a ${newStatus}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchAccounts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRevokeSessions = async (acc) => {
    if (!window.confirm(`¿Revocar todas las sesiones activas de ${acc.email}? El usuario deberá autenticarse nuevamente.`)) return;

    try {
      const res = await apiFetch(
        `/api/v1/accounts/${acc.id}/revoke-sessions`,
        { method: 'POST' },
        token
      );

      if (!res.ok) {
        throw new Error('Error al revocar las sesiones del trabajador');
      }

      setSuccessMsg(`Sesiones revocadas exitosamente para ${acc.email}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (filterRole === 'ADMIN') return acc.roles?.includes('ADMIN') || acc.roles?.includes('SUPERADMIN');
    if (filterRole === 'RECEPCION') return acc.roles?.includes('RECEPCION');
    if (filterRole === 'INACTIVE') return acc.status === 'INACTIVO';
    return true;
  });

  const adminCount = accounts.filter((a) => (a.roles?.includes('ADMIN') || a.roles?.includes('SUPERADMIN')) && a.status === 'ACTIVO').length;
  const recepcionCount = accounts.filter((a) => a.roles?.includes('RECEPCION') && a.status === 'ACTIVO').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Personal y Roles (HU-04)</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Administración institucional de cuentas de trabajadores, asignación de permisos RBAC y revocación de sesiones.
          </p>
        </div>

        <button onClick={() => { setFormError(null); setIsCreateOpen(true); }} className="btn btn-primary">
          + Nuevo Trabajador
        </button>
      </div>

      {successMsg && <div className="alert alert-success">✓ {successMsg}</div>}
      {error && <div className="alert alert-danger">✕ {error}</div>}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>TOTAL CUENTAS</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gold)' }}>{accounts.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Personal registrado</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>ADMINISTRADORES ACTIVOS</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gold)' }}>{adminCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>● Gestión de catálogo y accesos</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>RECEPCIONISTAS ACTIVOS</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{recepcionCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Atención en mostrador</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${filterRole === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '36px', fontSize: '13px' }}
          onClick={() => setFilterRole('ALL')}
        >
          Todos ({accounts.length})
        </button>
        <button
          className={`btn ${filterRole === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '36px', fontSize: '13px' }}
          onClick={() => setFilterRole('ADMIN')}
        >
          Administradores ({adminCount})
        </button>
        <button
          className={`btn ${filterRole === 'RECEPCION' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '36px', fontSize: '13px' }}
          onClick={() => setFilterRole('RECEPCION')}
        >
          Recepción ({recepcionCount})
        </button>
        <button
          className={`btn ${filterRole === 'INACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '36px', fontSize: '13px' }}
          onClick={() => setFilterRole('INACTIVE')}
        >
          Inactivos ({accounts.filter((a) => a.status === 'INACTIVO').length})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="state-loading">
          <div className="spinner"></div>
          <p>Cargando nómina de personal...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAccounts.length === 0 && (
        <div className="card state-empty">
          <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>No hay cuentas que coincidan con el filtro</p>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Ajuste el selector de rol o cree un nuevo trabajador con el botón superior.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && filteredAccounts.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Correo Institucional</th>
                <th>Roles Asignados</th>
                <th>Estado</th>
                <th>Fecha de Alta</th>
                <th style={{ textAlign: 'right' }}>Acciones Administrativas</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc) => {
                const isCurrentSelf = user?.email?.toLowerCase() === acc.email?.toLowerCase();
                const isAccAdmin = acc.roles?.includes('ADMIN') || acc.roles?.includes('SUPERADMIN');

                return (
                  <tr key={acc.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{acc.email}</div>
                      {isCurrentSelf && (
                        <span style={{ fontSize: '11px', color: 'var(--color-gold)' }}>
                          (Sesión actual)
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {acc.roles?.map((r) => (
                          <span
                            key={r}
                            className={`badge ${r === 'ADMIN' || r === 'SUPERADMIN' ? 'badge-gold' : 'badge-neutral'}`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${acc.status === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('es-PE') : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleToggleRole(acc)}
                          className="btn btn-secondary"
                          style={{ minHeight: '32px', padding: '0 8px', fontSize: '11px' }}
                          title={isAccAdmin ? 'Cambiar a Recepción' : 'Ascender a Administrador'}
                        >
                          {isAccAdmin ? 'Hacer Recepción' : 'Hacer Admin'}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(acc)}
                          className={`btn ${acc.status === 'ACTIVO' ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ minHeight: '32px', padding: '0 8px', fontSize: '11px' }}
                          title={acc.status === 'ACTIVO' ? 'Inactivar cuenta' : 'Activar cuenta'}
                        >
                          {acc.status === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleRevokeSessions(acc)}
                          className="btn btn-secondary"
                          style={{ minHeight: '32px', padding: '0 8px', fontSize: '11px' }}
                          title="Revocar todas las sesiones del trabajador"
                        >
                          Revocar Sesión
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear Trabajador */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '6px' }}>
              Registrar Cuenta de Personal (HU-04)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Cree un acceso institucional para personal de recepción o administración. No comparta credenciales.
            </p>

            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={handleCreateAccount}>
              <div className="form-group">
                <label className="form-label">Correo Institucional (@vipcenterfit.pe) *</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trabajador@vipcenterfit.pe"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña Temporal (Mínimo 8 caracteres) *</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={8}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                  El hash se almacena con BCrypt de forma segura. Nunca se guarda la contraseña en texto plano.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Rol del Trabajador *</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="RECEPCION">RECEPCION (Consultas y registro en mostrador)</option>
                  <option value="ADMIN">ADMIN (Configuración de planes y personal)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
