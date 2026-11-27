// ==============================================================================
// GYM VIP — Pantalla: StaffPage (Personal, Roles RBAC, Permisos y Auditoría)
// ==============================================================================

import React, { useMemo, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { changePrivilegedStaffRoleApi } from '../../api/staffApi';
import { useAuth } from '../../contexts/AuthContext';
import { useStaff } from '../../hooks/useStaff';
import { STAFF_ROLES } from '../../validators/staffValidator';
import { hasPermission, resolveEffectivePermissions } from '../../services/permissionsService';
import { formatDate } from '../../utils/formatters';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { GuideHint } from '../../components/common/GuideHint';
import { Icon } from '../../components/common/Icons';
import { VipTabBar } from '../../components/common/VipTabBar';
import { LoadingState, EmptyState } from '../../components/feedback/LoadingState';
import StaffModal from '../../components/modals/StaffModal';

const PAGE_SIZE = 6;
const PRIVILEGED_ROLES = ['SUPER_ADMIN', 'SOPORTE_PLATAFORMA', 'ADMIN_EMPRESA'];

export default function StaffPage() {
  const { token, isAdmin, isGerente, user } = useAuth();
  const canViewStaff = hasPermission(user, 'employees.read') || isAdmin() || (isGerente && isGerente());
  const canManageRoles = hasPermission(user, 'employees.assign_role');
  const canManagePrivilegedRoles = user?.roles?.includes('SUPER_ADMIN') && !user?.mfaEnrollmentRequired;

  const {
    accounts,
    assignableRoles,
    rolesCatalog,
    permissionsCatalog,
    auditEvents,
    loading,
    error,
    setError,
    successToast,
    setSuccessToast,
    actionSubmitting,
    loadAccounts,
    updateProfile,
    inactivateAccount,
  } = useStaff(token, canViewStaff);

  const [privilegedTarget, setPrivilegedTarget] = useState(null);
  const [privilegedSubmitting, setPrivilegedSubmitting] = useState(false);
  const [privilegedError, setPrivilegedError] = useState(null);
  const [sectionTab, setSectionTab] = useState('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [inspectAccount, setInspectAccount] = useState(null);
  const [confirmInactivateAccount, setConfirmInactivateAccount] = useState(null);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accounts.filter((acc) => {
      const fullName = [acc.firstName, acc.lastName].filter(Boolean).join(' ').toLowerCase();
      const roleName = acc.roles?.[0] || '';
      const matchesQ = !q || acc.email?.toLowerCase().includes(q) || fullName.includes(q) || (acc.phone || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || (acc.roles || []).includes(roleFilter);
      const matchesStatus = statusFilter === 'ALL' || acc.status === statusFilter;
      return matchesQ && matchesRole && matchesStatus && roleName !== 'CLIENTE';
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedAccounts = filteredAccounts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!canViewStaff) {
    return null;
  }

  const handleCreateSuccess = (newAccount) => {
    setIsCreateOpen(false);
    setSuccessToast(`¡Cuenta de personal "${newAccount.email}" creada con éxito!`);
    loadAccounts();
  };

  const handleConfirmInactivate = async () => {
    if (!confirmInactivateAccount) return;
    await inactivateAccount(confirmInactivateAccount);
    setConfirmInactivateAccount(null);
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    if (!editingProfile) return;
    const ok = await updateProfile(
      editingProfile.id,
      editingProfile,
      canManageRoles ? editingProfile.role : null,
      editingProfile.originalRole
    );
    if (ok) setEditingProfile(null);
  };

  const handlePrivilegedChange = async (event) => {
    event.preventDefault();
    if (privilegedSubmitting) return;
    const fields = new FormData(event.currentTarget);
    const role = String(fields.get('role'));
    const roleKey = PRIVILEGED_ROLES.includes(role) ? 'targetRole' : 'replacementRole';
    setPrivilegedError(null);
    setPrivilegedSubmitting(true);
    try {
      await changePrivilegedStaffRoleApi({
        accountId: privilegedTarget.id,
        [roleKey]: role,
        currentPassword: fields.get('currentPassword'),
        mfaCode: fields.get('mfaCode'),
        reason: String(fields.get('reason')).trim(),
      }, token);
      setPrivilegedTarget(null);
      setSuccessToast('Rol actualizado. Se cerraron las sesiones del colaborador.');
      loadAccounts();
    } catch (err) {
      setPrivilegedError(err.message);
    } finally {
      setPrivilegedSubmitting(false);
    }
  };

  return (
    <div className="staff-page" style={{ maxWidth: '1160px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
            Personal, Roles y Permisos RBAC
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            Jerarquía organizacional (Plataforma → Empresa → Sede), protección de superusuarios y auditoría de accesos.
          </p>
        </div>

        {hasPermission(user, 'employees.create') && assignableRoles.length > 0 && (
          <Button variant="primary" onClick={() => setIsCreateOpen(true)} style={{ minHeight: '44px', fontSize: '14px' }}>
            <Icon name="plus" size={16} />
            <span>Nuevo Colaborador</span>
          </Button>
        )}
      </div>

      <GuideHint
        title="Control granular y protección de administradores"
        description="Ningún usuario puede autoinactivarse ni autodegradarse. Cambiar el correo o rol revoca de inmediato las sesiones activas previas."
      />

      <div style={{ marginBottom: '20px' }}>
        <VipTabBar
          tabs={[
            { id: 'directory', label: `Nómina de Personal (${filteredAccounts.length})`, icon: 'users' },
            { id: 'rbac', label: 'Roles y Permisos RBAC', icon: 'shield-check', badge: String(rolesCatalog.length || 21) },
            { id: 'audit', label: `Historial de Cambios (${auditEvents.length})`, icon: 'activity' },
          ]}
          activeTab={sectionTab}
          onChange={setSectionTab}
          ariaLabel="Secciones de personal y roles"
        />
      </div>

      {successToast && <Alert variant="success" message={successToast} onClose={() => setSuccessToast(null)} />}
      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

      {sectionTab === 'directory' && (
        <>
          <div className="card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="search"
              className="form-input"
              placeholder="Buscar por nombre, correo o teléfono…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ flex: '1 1 260px', minWidth: '220px' }}
              aria-label="Buscar colaborador"
            />
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              style={{ minWidth: '180px' }}
              aria-label="Filtrar por rol"
            >
              <option value="ALL">Todos los roles</option>
              {STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.value}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ minWidth: '150px' }}
              aria-label="Filtrar por estado"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <LoadingState message="Consultando nómina de colaboradores…" />
            ) : pagedAccounts.length === 0 ? (
              <EmptyState title="Sin resultados" subtitle="No hay colaboradores que coincidan con los filtros actuales." />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>Rol Asignado</th>
                      <th>MFA / Seguridad</th>
                      <th>Estado</th>
                      <th>Alta</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAccounts.map((acc) => {
                      const isCurrent = user && user.email === acc.email;
                      const isActive = acc.status === 'ACTIVO';
                      const roleName = acc.roles?.[0] || 'RECEPCION';
                      const initial = acc.email ? acc.email.charAt(0).toUpperCase() : 'C';
                      const isPrivileged = PRIVILEGED_ROLES.includes(roleName);

                      return (
                        <tr key={acc.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px', height: '34px', borderRadius: 'var(--radius-full)',
                                  background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '13px', fontWeight: 700,
                                  color: isPrivileged ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                                  flexShrink: 0,
                                }}
                                aria-hidden="true"
                              >
                                {initial}
                              </div>
                              <div>
                                <strong style={{ color: 'var(--color-text-primary)' }}>
                                  {[acc.firstName, acc.lastName].filter(Boolean).join(' ') || acc.email}
                                </strong>
                                {(acc.firstName || acc.lastName) && (
                                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{acc.email}</div>
                                )}
                                {isCurrent && (
                                  <Badge variant="gold" style={{ marginLeft: '6px', fontSize: '10px', padding: '2px 6px' }}>
                                    Tu Sesión
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge variant={isPrivileged ? 'gold' : 'neutral'}>{roleName}</Badge>
                          </td>
                          <td>
                            <Badge variant={acc.mfaEnabled ? 'success' : 'neutral'}>
                              {acc.mfaEnabled ? 'TOTP Activo' : 'Sin MFA'}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant={isActive ? 'success' : 'neutral'}>{acc.status}</Badge>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{formatDate(acc.createdAt)}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {!isCurrent && isActive && canManagePrivilegedRoles && (
                                <Button variant="secondary" onClick={() => {
                                  setPrivilegedError(null);
                                  setPrivilegedTarget(acc);
                                }}>
                                  Privilegios
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                onClick={() => setInspectAccount(acc)}
                                style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px' }}
                              >
                                Permisos
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => setEditingProfile({
                                  id: acc.id,
                                  email: acc.email,
                                  firstName: acc.firstName || '',
                                  lastName: acc.lastName || '',
                                  phone: acc.phone || '',
                                  role: roleName,
                                  originalRole: roleName,
                                  isCurrent,
                                })}
                                style={{ fontSize: '12px', padding: '5px 10px', minHeight: '32px' }}
                              >
                                Editar / Rol
                              </Button>
                              {isActive && (
                                <Button
                                  variant="secondary"
                                  disabled={isCurrent}
                                  title={isCurrent ? 'No puedes autoinactivar tu propia cuenta' : 'Revocar acceso'}
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

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Página {safePage} de {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <Button variant="secondary" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {sectionTab === 'rbac' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700 }}>Catálogo de Roles Empresariales</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Diferencia responsabilidades entre plataforma SaaS, empresa contratante, sede operativa y autoservicio móvil.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rol</th>
                    <th>Nivel</th>
                    <th>Estado</th>
                    <th>Privilegiado</th>
                    <th>Descripción y Permisos</th>
                  </tr>
                </thead>
                <tbody>
                  {(rolesCatalog.length > 0 ? rolesCatalog : STAFF_ROLES.map((r) => ({
                    code: r.value, displayName: r.label, level: r.level, privileged: r.privileged,
                    implementedInProduct: true, defaultPermissions: resolveEffectivePermissions({ roles: [r.value] }),
                  }))).map((r) => (
                    <tr key={r.code}>
                      <td><strong>{r.code}</strong></td>
                      <td><Badge variant="neutral">{r.level}</Badge></td>
                      <td>
                        <Badge variant={r.implementedInProduct ? 'success' : 'neutral'}>
                          {r.implementedInProduct ? 'Activo' : 'Roadmap'}
                        </Badge>
                      </td>
                      <td>{r.privileged ? <Badge variant="gold">Crítico</Badge> : 'Estándar'}</td>
                      <td>
                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>{r.displayName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {(r.defaultPermissions || []).length} permisos asignados
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {permissionsCatalog.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: 700 }}>Matriz de Permisos Granulares</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                {permissionsCatalog.map((perm) => (
                  <div key={perm.code} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-gold)' }}>{perm.code}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{perm.module} · {perm.action}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{perm.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sectionTab === 'audit' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {auditEvents.length === 0 ? (
            <EmptyState title="Sin eventos recientes" subtitle="Los cambios en cuentas, roles y MFA aparecerán aquí." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Actor</th>
                    <th>Acción</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{formatDate(ev.timestampUtc)}</td>
                      <td style={{ fontSize: '13px' }}>{ev.actorEmail || 'sistema'}</td>
                      <td><Badge variant="gold">{ev.action}</Badge></td>
                      <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{ev.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(privilegedTarget)}
        onClose={() => { if (!privilegedSubmitting) setPrivilegedTarget(null); }}
        fullWidth
        maxWidth="xs"
      >
        {privilegedTarget && (
          <form onSubmit={handlePrivilegedChange}>
            <DialogTitle>Modificar privilegios</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <strong>{privilegedTarget.email}</strong>
                <TextField select label="Rol de destino" name="role" required defaultValue="">
                  {(privilegedTarget.roles?.some((role) => PRIVILEGED_ROLES.includes(role))
                    ? rolesCatalog.filter(({ code }) => code !== 'CLIENTE' && !privilegedTarget.roles.includes(code))
                    : rolesCatalog.filter(({ code }) => PRIVILEGED_ROLES.includes(code))
                  ).map(({ code, displayName }) => <MenuItem key={code} value={code}>{displayName}</MenuItem>)}
                </TextField>
                <TextField label="Motivo del cambio" name="reason" required multiline minRows={2}
                  slotProps={{ htmlInput: { minLength: 8, maxLength: 400 } }} />
                <TextField label="Tu contraseña actual" name="currentPassword" type="password"
                  autoComplete="current-password" required />
                <TextField label="Código de autenticación" name="mfaCode" required
                  slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', pattern: '[0-9]{6}' } }} />
                {privilegedError && <Alert variant="danger" message={privilegedError} />}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button type="button" variant="secondary" disabled={privilegedSubmitting} onClick={() => setPrivilegedTarget(null)}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={privilegedSubmitting}>Confirmar cambio</Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      {isCreateOpen && (
        <StaffModal token={token} assignableRoles={assignableRoles} onClose={() => setIsCreateOpen(false)} onSuccess={handleCreateSuccess} />
      )}

      {/* Editar Usuario + Cambiar Rol integrado */}
      {editingProfile && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="staff-edit-title">
          <form className="modal-content" style={{ maxWidth: '500px', padding: '28px' }} onSubmit={handleUpdateProfile}>
            <h3 id="staff-edit-title" style={{ marginTop: 0 }}>Editar Colaborador y Rol</h3>
            {[
              ['firstName', 'Nombres', 'text'],
              ['lastName', 'Apellidos', 'text'],
              ['phone', 'Teléfono', 'tel'],
              ['email', 'Correo institucional', 'email'],
            ].map(([field, label, type]) => (
              <div className="form-group" key={field}>
                <label className="form-label" htmlFor={`staff-edit-${field}`}>{label}</label>
                <input
                  id={`staff-edit-${field}`}
                  className="form-input"
                  type={type}
                  maxLength={field === 'email' ? 150 : field === 'phone' ? 30 : 120}
                  required={field === 'email'}
                  value={editingProfile[field]}
                  onChange={(event) => setEditingProfile({ ...editingProfile, [field]: event.target.value })}
                />
              </div>
            ))}

            {canManageRoles && (
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label" htmlFor="staff-edit-role">Rol Asignado</label>
                <select
                  id="staff-edit-role"
                  className="form-select"
                  value={editingProfile.role}
                  disabled={editingProfile.isCurrent || !assignableRoles.some(({ code }) => code === editingProfile.originalRole)}
                  onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value })}
                >
                  {!assignableRoles.some(({ code }) => code === editingProfile.role) && (
                    <option value={editingProfile.role}>{editingProfile.role}</option>
                  )}
                  {assignableRoles.map((r) => (
                    <option key={r.code} value={r.code}>{r.displayName}</option>
                  ))}
                </select>
                {editingProfile.isCurrent && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Por seguridad, tu propio rol no puede degradarse desde esta sesión.
                  </p>
                )}
              </div>
            )}

            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Cambiar correo o rol revoca las sesiones activas del colaborador.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <Button type="button" variant="secondary" onClick={() => setEditingProfile(null)} disabled={actionSubmitting}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={actionSubmitting}>{actionSubmitting ? 'Guardando…' : 'Guardar cambios'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Vista de Detalle y Permisos Efectivos */}
      {inspectAccount && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="staff-perms-title">
          <div className="modal-content" style={{ maxWidth: '580px', padding: '28px' }}>
            <h3 id="staff-perms-title" style={{ marginTop: 0 }}>Permisos Efectivos — {inspectAccount.email}</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Roles: <strong>{(inspectAccount.roles || []).join(', ')}</strong> · Estado: <strong>{inspectAccount.status}</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '280px', overflowY: 'auto', margin: '16px 0' }}>
              {resolveEffectivePermissions(inspectAccount).map((perm) => (
                <Badge key={perm} variant="neutral">{perm}</Badge>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setInspectAccount(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {confirmInactivateAccount && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '28px' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 12px 0' }}>Confirmar Inactivación de Cuenta</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
              ¿Estás seguro de revocar el acceso a <strong>&ldquo;{confirmInactivateAccount.email}&rdquo;</strong>? Se cerrarán todas sus sesiones y quedará registrado en auditoría.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={() => setConfirmInactivateAccount(null)} disabled={actionSubmitting}>Cancelar</Button>
              <Button variant="danger" onClick={handleConfirmInactivate} disabled={actionSubmitting}>
                {actionSubmitting ? 'Inactivando…' : 'Inactivar Cuenta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
