// ==============================================================================
// GYM VIP — Gestión de Áreas, Instalaciones y Canales de Comunicación (HU-34)
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFacilitiesApi, getFacilitiesArchiveApi, restoreFacilityApi, updateFacilityStatusApi, createFacilityApi, getChannelStatusApi } from '../api/facilityApi';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icons';
import { Alert } from '../components/common/Alert';

export default function FacilitiesPage() {
  const { token, isAdmin } = useAuth();

  const [facilities, setFacilities] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const [channelStatus, setChannelStatus] = useState(null);
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
      const [facData, chanData] = await Promise.all([
        showArchive ? getFacilitiesArchiveApi(token) : getFacilitiesApi(token),
        getChannelStatusApi(token).catch(() => null),
      ]);
      setFacilities(Array.isArray(facData) ? facData : []);
      if (chanData?.channels) {
        setChannelStatus(chanData.channels);
      }
    } catch (err) {
      setError(err.message || 'Error al conectar con los servicios de instalaciones.');
    } finally {
      setLoading(false);
    }
  }, [token, showArchive]);

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
    <div className="facilities-page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '1px' }}>GESTIÓN OPERATIVA</span>
          <h1 style={{ fontSize: '24px', margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>Áreas e Instalaciones VIP</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isAdmin() && (
            <button type="button" className="btn btn-secondary" onClick={() => setShowArchive((value) => !value)}>
              {showArchive ? 'Ver instalaciones activas' : 'Ver archivo'}
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
          {isAdmin() && (
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
          title="Error en Instalaciones"
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

      {/* Monitoreo de Canales de Notificación */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Icon name="bell" size={18} color="var(--color-gold)" />
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-primary)' }}>
            Estado de Canales de Notificación y Envío Outbox
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--color-surface-variant)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>WhatsApp (Meta Cloud API)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{channelStatus?.whatsapp?.provider || 'Meta v21'}</span>
              <Badge variant={channelStatus?.whatsapp?.status === 'CONFIGURED_REAL' ? 'success' : 'warning'}>
                {channelStatus?.whatsapp?.status || 'SIMULATION'}
              </Badge>
            </div>
          </div>
          <div style={{ background: 'var(--color-surface-variant)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Correo Electrónico (Resend)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{channelStatus?.email?.provider || 'Resend API'}</span>
              <Badge variant={channelStatus?.email?.status === 'CONFIGURED_REAL' ? 'success' : 'warning'}>
                {channelStatus?.email?.status || 'SIMULATION'}
              </Badge>
            </div>
          </div>
          <div style={{ background: 'var(--color-surface-variant)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Push Móvil (Firebase FCM)</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Firebase Messaging</span>
              <Badge variant={channelStatus?.push?.status === 'CONFIGURED_REAL' ? 'success' : 'warning'}>
                {channelStatus?.push?.status || 'NO VERIFICADO'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Instalaciones */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
          Cargando catálogo de áreas e instalaciones...
        </div>
      ) : facilities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--color-surface)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{showArchive ? 'No hay instalaciones archivadas.' : 'No hay áreas registradas actualmente en el sistema.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {facilities.map((fac) => (
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
