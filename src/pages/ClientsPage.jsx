// ==============================================================================
// GYM VIP — Directorio Oficial de Socios y Clientes
// Alta de socios, importación masiva .xlsx, membresías, fichas y auditoría
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClients } from '../hooks/useClients';
import { memberOverview } from '../api/memberApi';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icons';
import { LoadingState, EmptyState } from '../components/feedback/LoadingState';

import ClientRegisterModal from '../components/modals/ClientRegisterModal';
import ClientImportModal from '../components/modals/ClientImportModal';
import MemberEditor from '../components/members/MemberEditor';
import MemberSale from '../components/members/MemberSale';
import MemberCredentials from '../components/members/MemberCredentials';
import MemberConfirmation from '../components/members/MemberConfirmation';
import MemberProfilePage from './MemberProfilePage';
import { dateLabel, stateLabel } from '../components/members/memberUtils';

export default function ClientsPage() {
  const { token, isAdmin } = useAuth();
  const {
    clients,
    page,
    totalPages,
    totalElements,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    successToast,
    setSuccessToast,
    loadClients,
    handleSearchSubmit,
    handleClearSearch,
  } = useClients(token);

  // Estados de integración de miembros
  const [overview, setOverview] = useState({});
  const [overviewError, setOverviewError] = useState('');
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/importar') && isAdmin()) {
      return { kind: 'import' };
    }
    return null;
  });
  const [credentials, setCredentials] = useState(null);

  // Sincronización de ruta para el modal de importación (/miembros/importar)
  useEffect(() => {
    const handlePopState = () => {
      const isImport = window.location.pathname.toLowerCase().includes('/importar');
      if (isImport && isAdmin()) {
        setAction({ kind: 'import' });
      } else {
        setAction((prev) => (prev?.kind === 'import' ? null : prev));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdmin]);

  const handleOpenImport = () => {
    if (!isAdmin()) return;
    if (window.location.pathname !== '/miembros/importar') {
      window.history.pushState({ modal: 'import' }, '', '/miembros/importar');
    }
    setAction({ kind: 'import' });
  };

  const handleCloseImport = () => {
    if (window.location.pathname.toLowerCase().includes('/importar')) {
      window.history.pushState({}, '', '/miembros');
    }
    setAction(null);
  };

  // Consulta en lote de estado de membresías de la página actual
  useEffect(() => {
    let active = true;
    setOverview({});
    setOverviewError('');
    if (clients.length) {
      memberOverview(clients.map((c) => c.id), token)
        .then((v) => active && setOverview(v))
        .catch((e) => active && setOverviewError(e.message));
    }
    return () => {
      active = false;
    };
  }, [clients, token]);

  const changed = (message) => {
    setAction(null);
    setSuccessToast(message);
    loadClients(searchQuery, page);
  };

  const getMembershipBadgeVariant = (state, clientStatus) => {
    if (clientStatus === 'INACTIVO') return 'neutral';
    switch (state) {
      case 'VIGENTE':
        return 'success';
      case 'POR_VENCER':
        return 'warning';
      case 'VENCIDO':
      case 'CANCELADA':
        return 'danger';
      case 'SIN_MEMBRESIA':
      default:
        return 'neutral';
    }
  };

  // Si se selecciona un socio para ver su ficha integral, mostramos su perfil completo
  if (selected) {
    return (
      <MemberProfilePage
        clientId={selected}
        onBack={() => {
          setSelected(null);
          loadClients(searchQuery, page);
        }}
        onChanged={() => loadClients(searchQuery, page)}
      />
    );
  }

  return (
    <div className="clients-page" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      {/* Encabezado Principal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              margin: '0 0 6px 0',
              color: 'var(--color-text-primary)',
            }}
          >
            Directorio de Miembros
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            {loading
              ? 'Cargando padrón oficial de miembros…'
              : `${totalElements || clients.length} ${(totalElements || clients.length) === 1 ? 'miembro registrado' : 'miembros registrados'} en el sistema.`}
          </p>
        </div>

        {/* Acciones principales de alta e importación */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin() && (
            <Button
              variant="secondary"
              onClick={handleOpenImport}
              style={{ minHeight: '44px', fontSize: '14px' }}
              title="Importar miembros existentes desde archivo Excel .xlsx (HU-06) - Solo Administrador"
            >
              <Icon name="tag" size={16} color="var(--color-gold)" />
              <span>Importar Miembros</span>
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => setAction({ kind: 'register' })}
            style={{ minHeight: '44px', fontSize: '14px' }}
          >
            <Icon name="plus" size={16} />
            <span>Nuevo Miembro</span>
          </Button>
        </div>
      </div>

      {/* Alertas del Sistema */}
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
        />
      )}

      {overviewError && (
        <Alert
          variant="danger"
          message={`No se pudieron verificar los estados de membresía: ${overviewError}`}
        />
      )}

      {/* Buscador de Miembros */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="input-with-icon" style={{ flex: 1, minWidth: '260px' }}>
            <span className="input-icon" aria-hidden="true">
              <Icon name="search" size={16} color="var(--color-gold)" />
            </span>
            <input
              type="text"
              className="form-input with-left-icon"
              placeholder="Buscar por código de miembro, nombre, email, teléfono o documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar miembros"
            />
          </div>
          <Button type="submit" variant="primary" style={{ minHeight: '42px' }} disabled={loading}>
            <Icon name="search" size={15} />
            <span>Buscar</span>
          </Button>
          {searchQuery && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleClearSearch}
              style={{ minHeight: '42px' }}
            >
              <span>Limpiar</span>
            </Button>
          )}
        </form>
      </div>

      {/* Tabla de Miembros */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingState message="Cargando padrón de miembros desde el servidor central..." />
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>
              No se pudo cargar el listado de miembros.
            </p>
            <Button variant="secondary" onClick={() => loadClients(searchQuery, page)}>
              Reintentar
            </Button>
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            title="No se encontraron miembros"
            subtitle={
              searchQuery
                ? 'Prueba con otro criterio de búsqueda.'
                : 'Presiona "Nuevo Miembro" o "Importar Miembros" para incorporar registros al padrón.'
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código Miembro</th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Contacto</th>
                  <th>Plan Actual</th>
                  <th>Estado Membresía</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const initial = c.firstName ? c.firstName.charAt(0).toUpperCase() : 'S';
                  const v = overview[c.id];
                  const badgeVariant = getMembershipBadgeVariant(v?.state, c.status);
                  const isInactive = c.status === 'INACTIVO';

                  return (
                    <tr key={c.id}>
                      <td>
                        <Badge
                          variant="gold"
                          style={{ fontFamily: 'monospace', fontSize: '12px', padding: '4px 10px' }}
                        >
                          {c.memberCode || 'SIN CÓDIGO'}
                        </Badge>
                      </td>
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
                              color: 'var(--color-gold)',
                              flexShrink: 0,
                            }}
                            aria-hidden="true"
                          >
                            {initial}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelected(c.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                color: 'var(--color-text-primary)',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                textDecoration: 'none',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                              title={`Abrir perfil integral de ${c.firstName} ${c.lastName}`}
                            >
                              {c.firstName} {c.lastName}
                            </button>
                            {c.email && (
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                {c.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {c.documents?.find((d) => d.isPrimary)?.documentNumber ||
                            c.documents?.[0]?.documentNumber ||
                            'Sin documento'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {c.phone || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                          {v ? v.planName || 'Sin plan' : overviewError ? 'Sin verificar' : 'Consultando…'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <Badge variant={badgeVariant}>
                            {isInactive ? 'Inactivo' : v ? stateLabel(v.state) : 'Sin verificar'}
                          </Badge>
                          {v?.lastIncludedDate && !isInactive && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              Vence: {dateLabel(v.lastIncludedDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => setSelected(c.id)}
                            title="Ver ficha"
                            aria-label={`Ver ficha de ${c.firstName} ${c.lastName}`}
                          >
                            <Icon name="eye" size={16} color="var(--color-gold)" />
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon"
                            disabled={isInactive}
                            onClick={() => setAction({ kind: 'sale', client: c })}
                            title="Cobrar plan"
                            aria-label={`Cobrar plan de ${c.firstName} ${c.lastName}`}
                          >
                            <Icon name="credit-card" size={16} color="var(--color-text-secondary)" />
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => setAction({ kind: 'edit', client: c })}
                            title="Editar"
                            aria-label={`Editar a ${c.firstName} ${c.lastName}`}
                          >
                            <Icon name="edit" size={16} color="var(--color-text-secondary)" />
                          </button>

                          {isAdmin() && (
                            <button
                              type="button"
                              className={`btn-action-icon ${isInactive ? 'activate' : 'deactivate'}`}
                              onClick={() => setAction({ kind: 'status', client: c })}
                              title={isInactive ? 'Activar' : 'Desactivar'}
                              aria-label={`${isInactive ? 'Activar' : 'Desactivar'} a ${c.firstName} ${c.lastName}`}
                            >
                              <Icon name="power" size={16} color={isInactive ? 'var(--color-success)' : 'var(--color-danger)'} />
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

      {/* Paginación */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Página {page + 1} de {Math.max(totalPages, 1)} ({totalElements || clients.length} resultados)
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            disabled={loading || page === 0}
            onClick={() => loadClients(searchQuery, page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={loading || page + 1 >= totalPages}
            onClick={() => loadClients(searchQuery, page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Modales de Flujo de Miembros */}
      {action?.kind === 'import' && isAdmin() && (
        <ClientImportModal
          token={token}
          onClose={handleCloseImport}
          onSuccess={(importResult) => {
            handleCloseImport();
            changed(`¡Importación masiva completada! Se crearon ${importResult.createdCount} miembros nuevos.`);
          }}
        />
      )}

      {action?.kind === 'register' && (
        <ClientRegisterModal
          token={token}
          onClose={() => setAction(null)}
          onSuccess={(newClient, accessCredentials) => {
            changed(`¡Miembro ${newClient.firstName || ''} ${newClient.lastName || ''} registrado con éxito!`);
            if (accessCredentials) {
              setCredentials(accessCredentials);
            }
          }}
        />
      )}

      {action?.kind === 'edit' && (
        <MemberEditor
          client={action.client}
          token={token}
          onClose={() => setAction(null)}
          onSaved={() => changed('¡Datos del miembro actualizados exitosamente!')}
        />
      )}

      {action?.kind === 'sale' && (
        <MemberSale
          client={action.client}
          onClose={() => setAction(null)}
          onSaved={() => changed('¡Pago registrado y membresía actualizada!')}
        />
      )}

      {action?.kind === 'status' && (
        <MemberConfirmation
          client={action.client}
          token={token}
          onClose={() => setAction(null)}
          onSaved={() => changed('¡Estado del miembro actualizado correctamente!')}
        />
      )}

      {credentials && (
        <MemberCredentials
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}
