// ==============================================================================
// GYM VIP — Pantalla: PlansPage (Catálogo Tarifario y Gestión de Planes HU-06)
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
  const { token, isBusinessExecutive } = useAuth();
  const isExecutive = isBusinessExecutive();
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

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmStatusPlan, setConfirmStatusPlan] = useState(null);
  const PLAN_PAGE_SIZE = 6;

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

  const visiblePlans = plans.filter((p) =>
    p.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))
  );
  const totalPages = Math.max(1, Math.ceil(visiblePlans.length / PLAN_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedPlans = visiblePlans.slice(safePage * PLAN_PAGE_SIZE, (safePage + 1) * PLAN_PAGE_SIZE);

  const getDurationLabel = (days) => {
    switch (Number(days)) {
      case 30: return 'Mensual (30d)';
      case 90: return 'Trimestral (90d)';
      case 180: return 'Semestral (180d)';
      case 365: return 'Anual (365d)';
      default: return `${days || '—'} días`;
    }
  };

  return (
    <div className="plans-page" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
          Tarifario oficial en Soles (PEN), versionado inmutable snapshot y condiciones de servicio.
        </p>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', gap: '6px' }} role="group" aria-label="Vista de planes">
            <Button variant={viewMode === 'cards' ? 'primary' : 'secondary'} onClick={() => setViewMode('cards')} style={{ minHeight: '36px', fontSize: '12px' }}>Tarjetas</Button>
            <Button variant={viewMode === 'table' ? 'primary' : 'secondary'} onClick={() => setViewMode('table')} style={{ minHeight: '36px', fontSize: '12px' }}>Tabla</Button>
          </div>
          {isExecutive ? (
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

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

        <div className="input-with-icon" style={{ minWidth: '240px', flex: '1', maxWidth: '360px' }}>
          <span className="input-icon" aria-hidden="true">
            <Icon name="search" size={15} color="var(--color-text-muted)" />
          </span>
          <input
            type="text"
            className="form-input with-left-icon"
            placeholder="Filtrar plan por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar plan por nombre"
          />
        </div>
      </div>

      {/* Grid de Tarjetas de Planes */}
      {loading ? (
        <div className="card">
          <LoadingState message="Cargando catálogo de planes..." />
        </div>
      ) : visiblePlans.length === 0 ? (
        <div className="card">
          <EmptyState
            title={query ? 'No se encontraron planes' : 'No hay planes en esta vista'}
            subtitle={query ? 'Pruebe con otro término de búsqueda o cambie el filtro de estado.' : (isExecutive ? 'Comience creando el primer plan de membresía.' : 'No se encontraron planes disponibles.')}
          />
        </div>
      ) : viewMode === 'table' ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Versión</th>
                <th>Duración</th>
                <th>Precio (PEN)</th>
                <th>Beneficios</th>
                <th>Estado</th>
                {isExecutive && <th style={{ textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {pagedPlans.map((p) => {
                const isActive = p.status === 'ACTIVO';
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{p.description || '—'}</div>
                    </td>
                    <td><Badge variant="gold">v{p.version}</Badge></td>
                    <td>{getDurationLabel(p.durationDays)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrencyPen(p.pricePen)}</td>
                    <td style={{ fontSize: '12px', maxWidth: '240px' }}>{p.benefits || '—'}</td>
                    <td><Badge variant={isActive ? 'success' : 'neutral'}>{p.status}</Badge></td>
                    {isExecutive && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Button variant="secondary" onClick={() => handleEdit(p)} style={{ fontSize: '12px', minHeight: '30px' }}>Editar</Button>
                          <Button variant="secondary" onClick={() => setConfirmStatusPlan(p)} style={{ fontSize: '12px', minHeight: '30px', color: isActive ? 'var(--color-danger)' : 'var(--color-success)' }}>
                            {isActive ? 'Inactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
          {pagedPlans.map((p) => {
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Badge variant="gold" style={{ fontSize: '11px', padding: '3px 8px' }}>
                        v{p.version}
                      </Badge>
                      <Badge variant="neutral" style={{ fontSize: '11px', padding: '3px 8px' }}>
                        {getDurationLabel(p.durationDays)}
                      </Badge>
                    </div>
                    <Badge variant={isActive ? 'success' : 'neutral'} style={{ fontSize: '11px' }}>
                      {p.status}
                    </Badge>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 8px 0', color: 'var(--color-text-primary)' }}>
                    {p.name}
                  </h3>

                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', minHeight: '36px', lineHeight: 1.5 }}>
                    {p.description || 'Sin descripción adicional.'}
                  </p>

                  <div style={{ margin: '16px 0', padding: '14px 18px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
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
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                        Beneficios:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                        <span style={{ color: 'var(--color-gold)', marginTop: '2px' }}><Icon name="check-circle" size={14} /></span>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {p.benefits}
                        </p>
                      </div>
                    </div>
                  )}

                  {p.conditions && (
                    <div style={{ marginBottom: '12px', background: 'rgba(212, 175, 55, 0.05)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                        Condiciones:
                      </span>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {p.conditions}
                      </p>
                    </div>
                  )}
                </div>

                {isExecutive && (
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '18px', borderTop: '1px solid var(--color-border)', marginTop: '16px' }}>
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

      {visiblePlans.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <span>Mostrando {visiblePlans.length} planes · Página {safePage + 1} de {totalPages}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={{ minHeight: '34px', fontSize: '12px' }}>Anterior</Button>
            <Button variant="secondary" disabled={safePage + 1 >= totalPages} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} style={{ minHeight: '34px', fontSize: '12px' }}>Siguiente</Button>
          </div>
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
