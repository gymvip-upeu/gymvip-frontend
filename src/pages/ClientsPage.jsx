// ==============================================================================
// GYM VIP — Pantalla: ClientsPage (Socios y Clientes - HU-01)
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClients } from '../hooks/useClients';
import { formatDate } from '../utils/formatters';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState, EmptyState } from '../components/feedback/LoadingState';
import ClientRegisterModal from '../components/modals/ClientRegisterModal';
import ClientDetailModal from '../components/modals/ClientDetailModal';

export default function ClientsPage() {
  const { token } = useAuth();
  const {
    clients,
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>
            Socios y Clientes
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            HU-01: Registro único, emisión de código de socio y consulta básica.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsRegisterOpen(true)}
          style={{ minHeight: '42px', fontSize: '14px' }}
        >
          ➕ Nuevo Socio
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por código de socio, nombre o número de documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar socios"
            />
          </div>
          <Button type="submit" variant="secondary" style={{ minHeight: '40px' }}>
            🔍 Buscar
          </Button>
          {searchQuery && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleClearSearch}
              style={{ minHeight: '40px' }}
            >
              Limpiar
            </Button>
          )}
        </form>
      </div>

      {/* Tabla de Socios */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingState message="Cargando padrón de socios desde el servidor..." />
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
                  <th>Teléfono</th>
                  <th>Fecha de Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Badge variant="gold" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {c.memberCode || 'SIN CÓDIGO'}
                      </Badge>
                    </td>
                    <td>
                      <strong>{c.firstName} {c.lastName}</strong>
                      {c.email && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {c.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>
                        {c.documentType || 'DNI'} {c.documentNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{c.phone}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {formatDate(c.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedClient(c)}
                        style={{ fontSize: '12px', padding: '6px 12px', minHeight: '32px' }}
                      >
                        👁️ Ver Ficha
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Alta */}
      {isRegisterOpen && (
        <ClientRegisterModal
          token={token}
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {/* Modal Ficha Detalle */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
