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
import { Icon } from '../components/common/Icons';
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
    <div className="plans-page" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
            Catálogo de Planes y Tarifas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            Tarifario oficial en Soles (PEN), versionado inmutable snapshot y control de duraciones de 30 días.
          </p>
        </div>

        {isAdmin() ? (
          <Button
            variant="primary"
            onClick={handleCreateNew}
            style={{ minHeight: '44px', fontSize: '14px' }}
          >
            <Icon name="plus" size={16} />
            <span>Nuevo Plan</span>
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'Todos los Planes' },
          { id: 'ACTIVO', label: 'Planes Activos' },
          { id: 'INACTIVO', label: 'Planes Inactivos' },
        ].map((st) => (
          <Button
            key={st.id}
            variant={filterStatus === st.id ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus(st.id)}
            style={{ fontSize: '13px', minHeight: '38px' }}
          >
            {st.label}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
          {plans.map((p) => {
            const isActive = p.status === 'ACTIVO';
            return (
              <div
                key={p.id}
                className="card plan-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isActive ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '28px',
                  background: isActive ? 'var(--color-surface-panel)' : 'rgba(21, 25, 34, 0.5)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <Badge variant="gold" style={{ fontSize: '11px', padding: '3px 8px' }}>
                      Versión {p.version}
                    </Badge>
                    <Badge variant={isActive ? 'success' : 'neutral'} style={{ fontSize: '11px' }}>
                      {p.status}
                    </Badge>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 8px 0', color: 'var(--color-text-primary)' }}>
                    {p.name}
                  </h3>

                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', minHeight: '40px', lineHeight: 1.5 }}>
                    {p.description || 'Sin descripción adicional.'}
                  </p>

                  <div style={{ margin: '18px 0', padding: '14px 18px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-gold)', letterSpacing: '0.5px' }}>
                        {formatCurrencyPen(p.pricePen)}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        / {p.durationDays} días
                      </span>
                    </div>
                  </div>

                  {p.benefits && (
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                        Beneficios Incluidos:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '6px' }}>
                        <span style={{ color: 'var(--color-gold)', marginTop: '2px' }}><Icon name="check-circle" size={14} /></span>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {p.benefits}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {isAdmin() && (
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '18px', borderTop: '1px solid var(--color-border)' }}>
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(p)}
                      style={{ flex: 1, fontSize: '12px', minHeight: '36px' }}
                    >
                      <Icon name="edit" size={14} />
                      <span>Editar Tarifa</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmStatusPlan(p)}
                      style={{
                        fontSize: '12px',
                        minHeight: '36px',
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
