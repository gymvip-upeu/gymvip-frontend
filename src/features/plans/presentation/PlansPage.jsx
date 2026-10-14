import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { listPlansApi, setPlanStatusApi } from '../infrastructure/planApi';
import { formatCurrencyPen } from '../domain/plan';
import PlanModal from './PlanModal';

export default function PlansPage() {
  const { token, isAdmin } = useAuth();
  const [plans, setPlans] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmStatusPlan, setConfirmStatusPlan] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadPlans = async (status = filterStatus) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlansApi(status, token);
      setPlans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans(filterStatus);
  }, [filterStatus, token]);

  const handleCreateNew = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (savedPlan) => {
    setIsModalOpen(false);
    setSuccessToast(
      editingPlan
        ? `¡Plan "${savedPlan.name}" actualizado a la versión ${savedPlan.version}!`
        : `¡Plan "${savedPlan.name}" creado con éxito!`
    );
    loadPlans(filterStatus);
  };

  const handleToggleStatus = async () => {
    if (!confirmStatusPlan) return;
    const newStatus = confirmStatusPlan.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setUpdatingStatus(true);
    try {
      await setPlanStatusApi(confirmStatusPlan.id, newStatus, token);
      setSuccessToast(`Plan "${confirmStatusPlan.name}" ahora está ${newStatus}.`);
      setConfirmStatusPlan(null);
      loadPlans(filterStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>
            Catálogo de Planes y Tarifas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            HU-06: Tarifario estándar en Soles (PEN), versionado inmutable y control de estado.
          </p>
        </div>

        {isAdmin() ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateNew}
            style={{ minHeight: '42px', fontSize: '14px' }}
          >
            ➕ Nuevo Plan
          </button>
        ) : (
          <span className="badge badge-neutral" style={{ fontSize: '12px', padding: '6px 12px' }}>
            Modo Consulta (Recepción)
          </span>
        )}
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

      {/* Filtros de Estado */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['ALL', 'ACTIVO', 'INACTIVO'].map((st) => (
          <button
            key={st}
            type="button"
            className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(st)}
            style={{ fontSize: '13px', minHeight: '36px' }}
          >
            {st === 'ALL' ? 'Todos los Planes' : st === 'ACTIVO' ? 'Planes Activos' : 'Planes Inactivos'}
          </button>
        ))}
      </div>

      {/* Grid de Tarjetas de Planes */}
      {loading ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p>Cargando catálogo de planes...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>No hay planes registrados</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {isAdmin() ? 'Comienza creando el primer plan de membresía.' : 'No se encontraron planes disponibles.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {plans.map((p) => {
            const isActive = p.status === 'ACTIVO';
            return (
              <div
                key={p.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isActive ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
                  opacity: isActive ? 1 : 0.75,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                      Versión {p.version}
                    </span>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '11px' }}>
                      {p.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '4px 0 8px 0' }}>
                    {p.name}
                  </h3>

                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', minHeight: '36px' }}>
                    {p.description || 'Sin descripción adicional.'}
                  </p>

                  <div style={{ margin: '16px 0', padding: '12px 16px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-gold)' }}>
                        {formatCurrencyPen(p.pricePen)}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        / {p.durationDays} días
                      </span>
                    </div>
                  </div>

                  {p.benefits && (
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Beneficios:
                      </span>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        {p.benefits}
                      </p>
                    </div>
                  )}
                </div>

                {isAdmin() && (
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleEdit(p)}
                      style={{ flex: 1, fontSize: '12px', minHeight: '34px' }}
                    >
                      ✏️ Editar Tarifa
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setConfirmStatusPlan(p)}
                      style={{
                        fontSize: '12px',
                        minHeight: '34px',
                        color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                      }}
                    >
                      {isActive ? 'Inactivar' : 'Activar'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <PlanModal
          plan={editingPlan}
          token={token}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Modal Confirmar Inactivación/Activación */}
      {confirmStatusPlan && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '28px' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 12px 0' }}>
              Confirmar Cambio de Estado
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas marcar el plan <strong>"{confirmStatusPlan.name}"</strong> como{' '}
              <strong style={{ color: confirmStatusPlan.status === 'ACTIVO' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {confirmStatusPlan.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'}
              </strong>?
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '8px' }}>
              El historial de versiones se conserva íntegramente en base de datos sin eliminación física.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmStatusPlan(null)}
                disabled={updatingStatus}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleToggleStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Actualizando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
