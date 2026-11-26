// ==============================================================================
// GYM VIP — Gestión de Áreas, Instalaciones y Canales de Comunicación (HU-34)
// ==============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFacilitiesApi, getFacilitiesArchiveApi, restoreFacilityApi, updateFacilityStatusApi, createFacilityApi } from '../../api/facilityApi';
import { Badge } from '../../components/common/Badge';
import { Icon } from '../../components/common/Icons';
import { Alert } from '../../components/common/Alert';

const PAGE_SIZE = 6;

export default function FacilitiesPage() {
  const { token, isBusinessExecutive } = useAuth();
  const isExecutive = isBusinessExecutive();

  const [facilities, setFacilities] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal para cambio de estado operativo
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [newStatus, setNewStatus] = useState('MANTENIMIENTO');
  const [statusReason, setStatusReason] = useState('');
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Modal para creación de área
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    schedule: 'Lunes a Domingo 6:00 - 22:00',
    location: 'Piso 1',
    includedPlanTypes: 'TODOS',
    isIncluded: true,
    displayOrder: 1,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const facData = showArchive ? await getFacilitiesArchiveApi(token) : await getFacilitiesApi(token);
      setFacilities(Array.isArray(facData) ? facData : []);
    } catch (err) {
      setError(err.message || 'Error al conectar con los servicios de áreas.');
    } finally {
      setLoading(false);
    }
  }, [token, showArchive]);

  const filteredFacilities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return facilities.filter((fac) => {
      const matchesQ =
        !q ||
        (fac.name || '').toLowerCase().includes(q) ||
        (fac.description || '').toLowerCase().includes(q) ||
        (fac.location || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'TODOS' || fac.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [facilities, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFacilities.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedFacilities = filteredFacilities.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenStatusModal = (facility) => {
    setSelectedFacility(facility);
    setNewStatus(facility.status === 'DISPONIBLE' ? 'MANTENIMIENTO' : 'DISPONIBLE');
    setStatusReason('');
    setNotifyMembers(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedFacility) return;
    setSubmittingStatus(true);
    setError(null);
    try {
      await updateFacilityStatusApi(
        selectedFacility.id,
        newStatus,
        statusReason,
        notifyMembers,
        token
      );
      setSuccessMsg(`Estado de "${selectedFacility.name}" actualizado a ${newStatus}. ${notifyMembers && newStatus !== 'DISPONIBLE' ? 'Notificación outbox generada.' : ''}`);
      setSelectedFacility(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Error al actualizar estado operativo.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setError('El nombre de la instalación es obligatorio.');
      return;
    }
    setSubmittingStatus(true);
    setError(null);
    try {
      await createFacilityApi(createForm, token);
      setSuccessMsg(`Instalación "${createForm.name}" creada exitosamente.`);
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        description: '',
        schedule: 'Lunes a Domingo 6:00 - 22:00',
        location: 'Piso 1',
        includedPlanTypes: 'TODOS',
        isIncluded: true,
        displayOrder: 1,
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Error al registrar nueva instalación.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleRestore = async (facility) => {
    setError(null);
    try {
      await restoreFacilityApi(facility.id, token);
      setSuccessMsg(`"${facility.name}" restaurada en estado MANTENIMIENTO. Confirma su disponibilidad antes de abrirla al público.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo restaurar la instalación.');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'DISPONIBLE':
        return <Badge variant="success">Disponible</Badge>;
      case 'MANTENIMIENTO':
        return <Badge variant="warning">Mantenimiento</Badge>;
      case 'FUERA_DE_SERVICIO':
        return <Badge variant="danger">Fuera de Servicio</Badge>;
      default:
        return <Badge variant="default">{status || 'Disponible'}</Badge>;
    }
  };

  return (
    <div className="facilities-page-container" style={{ padding: '12px 20px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Barra de acciones sin encabezado duplicado ni bloque técnico de canales (COR-03, COR-04) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
          Administra zonas de entrenamiento, horarios, ubicaciones y estados operativos de cada área.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isExecutive && (
            <button type="button" className="btn btn-secondary" onClick={() => { setShowArchive((value) => !value); setPage(0); }}>
              {showArchive ? 'Ver áreas activas' : 'Ver archivadas'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <Icon name="refresh" size={16} /> Actualizar
          </button>
          {isExecutive && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <Icon name="plus" size={16} /> Nueva Área
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert
          variant="danger"
          title="Error en Áreas"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {successMsg && (
        <Alert
          variant="success"
          title="Operación Confirmada"
          message={successMsg}
          onClose={() => setSuccessMsg(null)}
        />
      )}

      {/* Barra de filtros, búsqueda y selector vista Tarjetas / Tabla */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '240px', flexWrap: 'wrap' }}>
          <div className="input-with-icon" style={{ flex: '1', minWidth: '210px', maxWidth: '340px' }}>
            <span className="input-icon" aria-hidden="true">
              <Icon name="search" size={15} color="var(--color-text-muted)" />
            </span>
            <input
              type="search"
              className="form-input with-left-icon"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              placeholder="Buscar área o piso..."
              aria-label="Buscar área por nombre o ubicación"
            />
          </div>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            aria-label="Filtrar áreas por estado"
            style={{ minWidth: '170px' }}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
          </select>
        </div>

        <div style={{ display: 'inline-flex', gap: '6px' }} role="group" aria-label="Modo de visualización">
          <button type="button" className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('cards')}>
            Tarjetas
          </button>
          <button type="button" className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('table')}>
            Tabla
          </button>
        </div>
      </div>

      {/* Lista de Áreas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
          Cargando catálogo de áreas...
        </div>
      ) : pagedFacilities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--color-surface)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{showArchive ? 'No hay áreas archivadas.' : 'No se encontraron áreas con los filtros actuales.'}</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Área</th>
                <th>Ubicación</th>
                <th>Horario</th>
                <th>Planes</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pagedFacilities.map((fac) => (
                <tr key={fac.id}>
                  <td>
                    <strong>{fac.name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{fac.description}</div>
                  </td>
                  <td>{fac.location}</td>
                  <td style={{ fontSize: '12px' }}>{fac.schedule}</td>
                  <td>{fac.includedPlanTypes || 'TODOS'}</td>
                  <td>{renderStatusBadge(fac.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {showArchive ? (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRestore(fac)}>Restaurar</button>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleOpenStatusModal(fac)}>Cambiar Estado</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {pagedFacilities.map((fac) => (
            <div
              key={fac.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-text-primary)' }}>{fac.name}</h3>
                  {renderStatusBadge(fac.status)}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                  {fac.description}
                </p>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  <b>Horario:</b> {fac.schedule}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  <b>Ubicación:</b> {fac.location}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {fac.isIncluded && <span style={{ fontSize: '11px', background: 'rgba(212,175,55,0.1)', color: 'var(--color-gold)', padding: '2px 8px', borderRadius: '4px' }}>Incluido en Planes</span>}
                  <span style={{ fontSize: '11px', background: 'var(--color-surface-variant)', color: 'var(--color-text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>Planes: {fac.includedPlanTypes || 'TODOS'}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                {showArchive ? (
                  <button type="button" className="btn btn-outline" onClick={() => handleRestore(fac)}>Restaurar en mantenimiento</button>
                ) : (
                  <button type="button" className="btn btn-outline" onClick={() => handleOpenStatusModal(fac)} style={{ fontSize: '12px', padding: '6px 12px' }}>
                    <Icon name="tool" size={14} /> Cambiar Estado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredFacilities.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <span>Mostrando {filteredFacilities.length} áreas · Página {safePage + 1} de {totalPages}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={safePage + 1 >= totalPages} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Siguiente</button>
          </div>
        </div>
      )}

      {/* Modal Cambio de Estado */}
      {selectedFacility && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '90%', maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-text-primary)' }}>
              Actualizar Estado: {selectedFacility.name}
            </h3>
            <form onSubmit={handleSaveStatus}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Nuevo Estado Operativo</label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--color-surface-variant)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                >
                  <option value="DISPONIBLE">DISPONIBLE (Operación Regular)</option>
                  <option value="MANTENIMIENTO">MANTENIMIENTO (Temporalmente no accesible)</option>
                  <option value="FUERA_DE_SERVICIO">FUERA DE SERVICIO (Interrupción)</option>
                </select>
              </div>

              {newStatus !== 'DISPONIBLE' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Motivo / Detalle para los Socios</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Ej. Limpieza técnica de filtros y revisión preventiva programada."
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--color-surface-variant)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="notifyMembersCheck"
                      checked={notifyMembers}
                      onChange={(e) => setNotifyMembers(e.target.checked)}
                    />
                    <label htmlFor="notifyMembersCheck" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      Notificar a socios mediante aviso en App y Push FCM (Outbox)
                    </label>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedFacility(null)}
                  disabled={submittingStatus}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingStatus}
                >
                  {submittingStatus ? 'Guardando...' : 'Confirmar Estado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Instalación */}
      {isCreateOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '90%', maxWidth: '520px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-text-primary)' }}>
              Registrar Nueva Área o Instalación
            </h3>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>Nombre de la Zona / Servicio</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Ej. Piscina Climatizada"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--color-surface-variant)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>Descripción</label>
                <textarea
                  className="form-control"
                  rows={2}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Equipamiento, normas y características de la zona."
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--color-surface-variant)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>Horario</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createForm.schedule}
                    onChange={(e) => setCreateForm({ ...createForm, schedule: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--color-surface-variant)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>Ubicación</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--color-surface-variant)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>Planes con Acceso (separados por coma)</label>
                <input
                  type="text"
                  className="form-control"
                  value={createForm.includedPlanTypes}
                  onChange={(e) => setCreateForm({ ...createForm, includedPlanTypes: e.target.value })}
                  placeholder="TODOS, o VIP, PREMIUM"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--color-surface-variant)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submittingStatus}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingStatus}
                >
                  {submittingStatus ? 'Creando...' : 'Crear Instalación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
