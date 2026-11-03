// ==============================================================================
// GYM VIP — Pantalla de Monitoreo y Estado de Comunicaciones (HU-18)
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCommunicationsApi, retryCommunicationApi } from '../api/commsApi';
import { Icon } from '../components/common/Icons';
import '../themes/commsAndReminders.css';

export default function CommunicationsPage() {
  const { token, isAdmin } = useAuth();

  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [channelFilter, setChannelFilter] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Paginación
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal de Detalle
  const [selectedComm, setSelectedComm] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const fetchCommunications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCommunicationsApi(
        {
          status: statusFilter,
          channel: channelFilter,
          search: searchTerm,
          page,
          size: 15,
        },
        token
      );

      if (data && data.content) {
        setCommunications(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || data.content.length);
      } else if (Array.isArray(data)) {
        setCommunications(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setCommunications([]);
      }
    } catch (err) {
      setError(err.message || 'Error al consultar las comunicaciones.');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, channelFilter, searchTerm, page]);

  useEffect(() => {
    fetchCommunications();
  }, [fetchCommunications]);

  const handleRetry = async (id) => {
    if (!window.confirm('¿Desea reintentar el despacho de este mensaje ahora?')) {
      return;
    }
    setRetryingId(id);
    setActionMsg(null);
    try {
      const updated = await retryCommunicationApi(id, token);
      setActionMsg(`Mensaje ${id} reintentado exitosamente. Nuevo estado: ${updated.status || 'SOLICITADO'}`);
      if (selectedComm && selectedComm.id === id) {
        setSelectedComm(updated);
      }
      fetchCommunications();
    } catch (err) {
      setError(err.message || 'Error al reintentar el envío.');
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'SOLICITADO':
        return 'badge-solicitado';
      case 'ACEPTADO_PROVEEDOR':
        return 'badge-proveedor';
      case 'ENVIADO':
        return 'badge-enviado';
      case 'ENTREGADO':
        return 'badge-entregado';
      case 'LEIDO':
        return 'badge-leido';
      case 'FALLIDO':
        return 'badge-fallido';
      default:
        return 'badge-solicitado';
    }
  };

  return (
    <div className="comms-page">
      <div className="comms-heading">
        <div>
          <h1>Monitoreo y Estado de Comunicaciones</h1>
          <p>Audite en tiempo real los envíos de WhatsApp, correo electrónico y notificaciones móviles de socios.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={fetchCommunications}
          disabled={loading}
        >
          <Icon name="refresh" size={15} style={{ marginRight: 6 }} />
          Actualizar
        </button>
      </div>

      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {actionMsg}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="comms-filters">
        <input
          type="search"
          placeholder="Buscar por teléfono enmascarado o Request ID..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="SOLICITADO">SOLICITADO</option>
          <option value="ACEPTADO_PROVEEDOR">ACEPTADO POR PROVEEDOR</option>
          <option value="ENVIADO">ENVIADO</option>
          <option value="ENTREGADO">ENTREGADO</option>
          <option value="LEIDO">LEÍDO</option>
          <option value="FALLIDO">FALLIDO</option>
        </select>

        <select
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="TODOS">Todos los Canales</option>
          <option value="WHATSAPP">WhatsApp Cloud</option>
          <option value="EMAIL">Email</option>
          <option value="APP">App Móvil</option>
        </select>
      </div>

      {/* Tabla de Mensajes */}
      <div className="comms-card">
        <header>
          <h2>Historial de Despachos</h2>
          <span style={{ fontSize: 12, color: '#888' }}>
            {totalElements} registros encontrados
          </span>
        </header>

        <div className="member-table-wrap">
          <table className="member-table">
            <thead>
              <tr>
                <th>Canal</th>
                <th>Destinatario Enmascarado</th>
                <th>Plantilla / Concepto</th>
                <th>Estado</th>
                <th>Intentos</th>
                <th>Fecha y Hora</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="member-empty">
                    <p>Consultando comunicaciones...</p>
                  </td>
                </tr>
              ) : communications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="member-empty">
                    <Icon name="message-circle" size={32} color="#666" />
                    <p>No se encontraron registros de comunicaciones con los filtros seleccionados.</p>
                  </td>
                </tr>
              ) : (
                communications.map((comm) => (
                  <tr key={comm.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon
                          name={comm.channel === 'WHATSAPP' ? 'message-circle' : 'bell'}
                          size={15}
                          color="var(--color-gold)"
                        />
                        <span>{comm.channel || 'WHATSAPP'}</span>
                      </div>
                    </td>
                    <td>
                      <code>{comm.recipient || 'N/D'}</code>
                    </td>
                    <td>
                      <strong>{comm.templateName || 'Aviso General'}</strong>
                      {comm.requestId && <small>Req: {comm.requestId}</small>}
                    </td>
                    <td>
                      <span className={`badge-status ${getStatusBadgeClass(comm.status)}`}>
                        {comm.status}
                      </span>
                    </td>
                    <td>{comm.attemptCount != null ? `${comm.attemptCount} / 3` : '1 / 3'}</td>
                    <td>
                      <div>{comm.createdAt ? new Date(comm.createdAt).toLocaleDateString('es-PE') : 'Hoy'}</div>
                      <small>{comm.createdAt ? new Date(comm.createdAt).toLocaleTimeString('es-PE') : ''}</small>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => setSelectedComm(comm)}
                        >
                          <Icon name="eye" size={13} style={{ marginRight: 4 }} />
                          Detalle
                        </button>

                        {comm.status === 'FALLIDO' && isAdmin() && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => handleRetry(comm.id)}
                            disabled={retryingId === comm.id}
                          >
                            <Icon name="refresh" size={13} style={{ marginRight: 4 }} />
                            {retryingId === comm.id ? 'Reintentando...' : 'Reintentar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="member-pagination" style={{ marginTop: 16 }}>
            <span>Página {page + 1} de {totalPages}</span>
            <div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {selectedComm && (
        <div className="modal-overlay-comms" onClick={() => setSelectedComm(null)}>
          <div className="modal-content-comms" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-comms">
              <h3>Detalle de Comunicación #{selectedComm.id}</h3>
              <button
                type="button"
                className="member-close"
                onClick={() => setSelectedComm(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body-comms">
              <div className="modal-row">
                <strong>ID Registro:</strong>
                <span>{selectedComm.id}</span>
              </div>
              <div className="modal-row">
                <strong>Request ID (Idempotencia):</strong>
                <span><code>{selectedComm.requestId || 'N/D'}</code></span>
              </div>
              <div className="modal-row">
                <strong>Proveedor Message ID:</strong>
                <span><code>{selectedComm.providerMessageId || 'N/D'}</code></span>
              </div>
              <div className="modal-row">
                <strong>Canal:</strong>
                <span>{selectedComm.channel}</span>
              </div>
              <div className="modal-row">
                <strong>Destinatario Enmascarado:</strong>
                <span><code>{selectedComm.recipient}</code></span>
              </div>
              <div className="modal-row">
                <strong>Plantilla:</strong>
                <span>{selectedComm.templateName}</span>
              </div>
              <div className="modal-row">
                <strong>Estado Actual:</strong>
                <span className={`badge-status ${getStatusBadgeClass(selectedComm.status)}`}>
                  {selectedComm.status}
                </span>
              </div>
              <div className="modal-row">
                <strong>Intentos Realizados:</strong>
                <span>{selectedComm.attemptCount || 1} / 3</span>
              </div>
              <div className="modal-row">
                <strong>Creado el:</strong>
                <span>{selectedComm.createdAt ? new Date(selectedComm.createdAt).toLocaleString('es-PE') : 'N/D'}</span>
              </div>
              <div className="modal-row">
                <strong>Última Actualización:</strong>
                <span>{selectedComm.updatedAt ? new Date(selectedComm.updatedAt).toLocaleString('es-PE') : 'N/D'}</span>
              </div>

              {selectedComm.errorMessage && (
                <div className="modal-row" style={{ color: '#f77c7c' }}>
                  <strong>Motivo de Falla:</strong>
                  <span>{selectedComm.errorMessage}</span>
                </div>
              )}

              {selectedComm.payload && (
                <div style={{ marginTop: 14 }}>
                  <strong style={{ color: '#9c9a93', display: 'block', marginBottom: 6 }}>
                    Parámetros / Payload Enviado:
                  </strong>
                  <pre
                    style={{
                      background: '#111',
                      border: '1px solid #333',
                      borderRadius: 6,
                      padding: 10,
                      fontSize: 11,
                      color: 'var(--color-gold)',
                      overflowX: 'auto',
                    }}
                  >
                    {typeof selectedComm.payload === 'object'
                      ? JSON.stringify(selectedComm.payload, null, 2)
                      : String(selectedComm.payload)}
                  </pre>
                </div>
              )}
            </div>

            <div className="modal-footer-comms">
              {selectedComm.status === 'FALLIDO' && isAdmin() && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleRetry(selectedComm.id)}
                  disabled={retryingId === selectedComm.id}
                >
                  <Icon name="refresh" size={14} style={{ marginRight: 6 }} />
                  {retryingId === selectedComm.id ? 'Reintentando...' : 'Reintentar Envío'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedComm(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
