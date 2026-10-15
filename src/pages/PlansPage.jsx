// ==============================================================================
// GYM VIP — Pantalla: PlansPage (Catálogo y Versiones de Planes - HU-06)
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { formatCurrencyPen } from '../utils/formatters';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState, EmptyState } from '../components/feedback/LoadingState';
import PlanModal from '../components/modals/PlanModal';

export default function PlansPage() {
  const { token, isAdmin } = useAuth();
  const {
    plans,
    filterStatus,
    setFilterStatus,
    loading,
    error,
    successToast,
    setSuccessToast,
    updatingStatus,
    loadPlans,
    changePlanStatus,
  } = usePlans(token);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmStatusPlan, setConfirmStatusPlan] = useState(null);

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

  const handleConfirmToggleStatus = async () => {
    if (!confirmStatusPlan) return;
    await changePlanStatus(confirmStatusPlan);
    setConfirmStatusPlan(null);
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
          <Button
            variant="primary"
            onClick={handleCreateNew}
            style={{ minHeight: '42px', fontSize: '14px' }}
          >
            ➕ Nuevo Plan
          </Button>
        ) : (
          <Badge variant="neutral" style={{ fontSize: '12px', padding: '6px 12px' }}>
            Modo Consulta (Recepción)
          </Badge>
        )}
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

      {/* Filtros de Estado */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['ALL', 'ACTIVO', 'INACTIVO'].map((st) => (
          <Button
            key={st}
            variant={filterStatus === st ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus(st)}
            style={{ fontSize: '13px', minHeight: '36px' }}
          >
            {st === 'ALL' ? 'Todos los Planes' : st === 'ACTIVO' ? 'Planes Activos' : 'Planes Inactivos'}
          </Button>
        ))}
      </div>

      {/* Grid de Tarjetas de Planes */}
      {loading ? (
        <div className="card">
          <LoadingState message="Cargando catálogo de planes..." />
        </div>
      ) : plans.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No hay planes registrados"
            subtitle={isAdmin() ? 'Comienza creando el primer plan de membresía.' : 'No se encontraron planes disponibles.'}
          />
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
                    <Badge variant="gold" style={{ fontSize: '11px' }}>
                      Versión {p.version}
                    </Badge>
                    <Badge variant={isActive ? 'success' : 'neutral'} style={{ fontSize: '11px' }}>
                      {p.status}
                    </Badge>
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
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(p)}
                      style={{ flex: 1, fontSize: '12px', minHeight: '34px' }}
                    >
                      ✏️ Editar Tarifa
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmStatusPlan(p)}
                      style={{
                        fontSize: '12px',
                        minHeight: '34px',
                        color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                      }}
                    >
                      {isActive ? 'Inactivar' : 'Activar'}
                    </Button>
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
              <Button
                variant="secondary"
                onClick={() => setConfirmStatusPlan(null)}
                disabled={updatingStatus}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmToggleStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Actualizando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
