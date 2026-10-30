// ==============================================================================
// GYM VIP — Pantalla: ClientsPage (Socios y Clientes - HU-01 / HU-02)
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClients } from '../hooks/useClients';
import { formatDate } from '../utils/formatters';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icons';
import { LoadingState, EmptyState } from '../components/feedback/LoadingState';
import ClientRegisterModal from '../components/modals/ClientRegisterModal';
import ClientManageModal from '../components/modals/ClientManageModal';

export default function ClientsPage() {
  const { token } = useAuth();
  const {
    clients,
    page,
    totalPages,
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

  // Modales
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleRegisterSuccess = (newClient) => {
    setIsRegisterOpen(false);
    setSuccessToast(`¡Socio ${newClient.firstName} ${newClient.lastName} registrado con éxito! Código: ${newClient.memberCode}`);
    loadClients(searchQuery);
  };

  return (
    <div className="clients-page" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
            Directorio de Socios
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            Padrón oficial de clientes: alta, consulta de ficha, edición concurrente y auditoría.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsRegisterOpen(true)}
          style={{ minHeight: '44px', fontSize: '14px' }}
        >
          <Icon name="plus" size={16} />
          <span>Nuevo Socio</span>
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
        />
      )}

      {/* Barra de búsqueda */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }} className="input-with-icon">
            <span className="input-icon" aria-hidden="true">
              <Icon name="search" size={16} color="var(--color-text-muted)" />
            </span>
            <input
              type="text"
              className="form-input with-left-icon"
              placeholder="Buscar por código de socio, nombre o número de documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar socios"
            />
          </div>
          <Button type="submit" variant="primary" style={{ minHeight: '42px' }}>
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

      {/* Tabla de Socios */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingState message="Cargando padrón de socios desde el servidor central..." />
        ) : clients.length === 0 ? (
          <EmptyState
            title="No se encontraron socios"
            subtitle={searchQuery ? 'Prueba con otro criterio de búsqueda.' : 'Presiona "Nuevo Socio" para dar de alta el primer registro.'}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código Socio</th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Contacto</th>
                  <th>Fecha de Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const initial = c.firstName ? c.firstName.charAt(0).toUpperCase() : 'S';
                  return (
                    <tr key={c.id}>
                      <td>
                        <Badge variant="gold" style={{ fontFamily: 'monospace', fontSize: '12px', padding: '4px 10px' }}>
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
                            <strong style={{ color: 'var(--color-text-primary)' }}>{c.firstName} {c.lastName}</strong>
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
                          {c.documents?.map((d) => `${d.documentType} ${d.documentNumber}`).join(' · ') || 'Sin documento'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {c.phone || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          {formatDate(c.createdAt)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedClient(c)}
                          style={{ fontSize: '12px', padding: '6px 12px', minHeight: '34px' }}
                          title="Ver ficha, editar o consultar historial"
                        >
                          <Icon name="eye" size={14} />
                          <span>Ficha / Gestionar</span>
                        </Button>
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
        <Button
          variant="secondary"
          disabled={loading || page === 0}
          onClick={() => loadClients(searchQuery, page - 1)}
        >
          Anterior
        </Button>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Página {page + 1} de {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="secondary"
          disabled={loading || page + 1 >= totalPages}
          onClick={() => loadClients(searchQuery, page + 1)}
        >
          Siguiente
        </Button>
      </div>

      {/* Modal Alta */}
      {isRegisterOpen && (
        <ClientRegisterModal
          token={token}
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {/* Modal Ficha y Edición con Auditoría */}
      {selectedClient && (
        <ClientManageModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdated={() => loadClients(searchQuery, page)}
        />
      )}
    </div>
  );
}
