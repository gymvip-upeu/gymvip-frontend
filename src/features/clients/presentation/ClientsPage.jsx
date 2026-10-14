import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { searchClientsApi } from '../infrastructure/clientApi';
import ClientRegisterModal from './ClientRegisterModal';
import ClientDetailModal from './ClientDetailModal';

export default function ClientsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Modales
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const loadClients = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchClientsApi(query, 0, 50, token);
      setClients(data.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients(searchQuery);
  }, [token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadClients(searchQuery);
  };

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

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsRegisterOpen(true)}
          style={{ minHeight: '42px', fontSize: '14px' }}
        >
          ➕ Nuevo Socio
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
          <button type="submit" className="btn btn-secondary" style={{ minHeight: '40px' }}>
            🔍 Buscar
          </button>
          {searchQuery && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                loadClients('');
              }}
              style={{ minHeight: '40px' }}
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Tabla de Socios */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p>Cargando padrón de socios desde el servidor...</p>
          </div>
        ) : clients.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>No se encontraron socios</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
              {searchQuery ? 'Prueba con otro criterio de búsqueda.' : 'Presiona "Nuevo Socio" para dar de alta el primer registro.'}
            </p>
          </div>
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
                      <span className="badge badge-gold" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {c.memberCode || 'SIN CÓDIGO'}
                      </span>
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
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-PE') : '-'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelectedClient(c)}
                        style={{ fontSize: '12px', padding: '6px 12px', minHeight: '32px' }}
                      >
                        👁️ Ver Ficha
                      </button>
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
