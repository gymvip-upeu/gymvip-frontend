import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/apiClient';

export default function PlansView() {
  const { token, isAdmin } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDuration, setFormDuration] = useState('30');
  const [formPrice, setFormPrice] = useState('120.00');
  const [formBenefits, setFormBenefits] = useState('');
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/plans', {}, token);
      if (!res.ok) throw new Error('Error al consultar los planes');
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [token]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormName('');
    setFormDesc('');
    setFormDuration('30');
    setFormPrice('120.00');
    setFormBenefits('Acceso total a sala de pesas y cardio');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormDesc(plan.description || '');
    setFormDuration(String(plan.durationDays));
    setFormPrice(String(plan.pricePen));
    setFormBenefits(plan.benefits || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const priceNum = parseFloat(formPrice);
    const durationNum = parseInt(formDuration, 10);

    if (!formName.trim()) {
      setFormError('El nombre del plan no puede estar vacío');
      setFormSubmitting(false);
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('El precio debe ser un número mayor a 0');
      setFormSubmitting(false);
      return;
    }
    if (isNaN(durationNum) || durationNum <= 0) {
      setFormError('La duración debe ser de al menos 1 día');
      setFormSubmitting(false);
      return;
    }

    try {
      const url = editingPlan ? `/api/v1/plans/${editingPlan.id}` : '/api/v1/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      if (formName.toLowerCase().includes('mensual') && durationNum !== 30) {
        setFormError('La duración de un plan mensual debe ser exactamente de 30 días');
        setFormSubmitting(false);
        return;
      }

      const res = await apiFetch(
        url,
        {
          method,
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim(),
            durationDays: durationNum,
            pricePen: priceNum,
            benefits: formBenefits.trim(),
          }),
        },
        token
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al guardar el plan');
      }

      setIsModalOpen(false);
      setSuccessMsg(editingPlan ? 'Plan actualizado con éxito (nueva versión registrada)' : 'Plan creado y persistido con éxito');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchPlans();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const togglePlanStatus = async (plan) => {
    const nextStatus = plan.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      const res = await apiFetch(
        `/api/v1/plans/${plan.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        },
        token
      );
      if (!res.ok) throw new Error('No se pudo cambiar el estado');
      fetchPlans();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (filterStatus === 'ACTIVE') return p.status === 'ACTIVO';
    if (filterStatus === 'INACTIVE') return p.status === 'INACTIVO';
    return true;
  });

  const activeCount = plans.filter((p) => p.status === 'ACTIVO').length;
  const avgPrice = plans.length > 0 ? (plans.reduce((acc, p) => acc + Number(p.pricePen), 0) / plans.length).toFixed(2) : '0.00';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Catálogo de Planes (HU-06)</h1>
          <p style={{ color: 'var(--color-ink-600)', fontSize: 'var(--font-size-sm)' }}>
            Configuración de membresías con precios, duración y condiciones contractuales.
          </p>
        </div>

        {isAdmin() ? (
          <button onClick={openCreateModal} className="btn btn-primary">
            + Nuevo Plan
          </button>
        ) : (
          <div className="badge badge-warning" title="Permiso de creación exclusivo para Administrador">
            Solo Administrador puede crear
          </div>
        )}
      </div>

      {successMsg && <div className="alert alert-success">✓ {successMsg}</div>}
      {error && <div className="alert alert-danger">✕ {error}</div>}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-600)', fontWeight: 600 }}>TOTAL PLANES</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-brand-700)' }}>{plans.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>● Persistidos en Base de Datos</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-600)', fontWeight: 600 }}>PLANES ACTIVOS</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-brand-500)' }}>{activeCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-ink-600)', marginTop: '4px' }}>Disponibles para contratación</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-600)', fontWeight: 600 }}>PRECIO PROMEDIO</div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-ink-900)' }}>S/ {avgPrice}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-ink-600)', marginTop: '4px' }}>Tarifa regular en PEN</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '36px', fontSize: '13px' }}
          onClick={() => setFilterStatus('ALL')}
        >
          Todos ({plans.length})
        </button>
        <button
          className={`btn ${filterStatus === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '36px', fontSize: '13px' }}
          onClick={() => setFilterStatus('ACTIVE')}
        >
          Activos ({activeCount})
        </button>
        <button
          className={`btn ${filterStatus === 'INACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '36px', fontSize: '13px' }}
          onClick={() => setFilterStatus('INACTIVE')}
        >
          Inactivos ({plans.length - activeCount})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="state-loading">
          <div className="spinner"></div>
          <p>Cargando planes de membresía...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPlans.length === 0 && (
        <div className="card state-empty">
          <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>No hay planes registrados</p>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            {isAdmin() ? 'Comience creando un nuevo plan con el botón superior.' : 'No hay planes disponibles para mostrar.'}
          </p>
        </div>
      )}

      {/* Grid of Plans */}
      {!loading && filteredPlans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className={`badge ${plan.status === 'ACTIVO' ? 'badge-success' : 'badge-neutral'}`}>
                  {plan.status === 'ACTIVO' ? '✓ Activo' : '● Inactivo'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-ink-400)', fontWeight: 600 }}>
                  v{plan.version}
                </span>
              </div>

              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '6px' }}>{plan.name}</h3>
              <p style={{ color: 'var(--color-ink-600)', fontSize: 'var(--font-size-sm)', flex: 1, marginBottom: '16px' }}>
                {plan.description || 'Sin descripción detallada.'}
              </p>

              <div style={{ margin: '12px 0', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-brand-700)' }}>
                    S/ {Number(plan.pricePen).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-600)', fontWeight: 500 }}>
                    {plan.durationDays} días
                  </span>
                </div>
              </div>

              {plan.benefits && (
                <div style={{ background: 'var(--color-surface-50)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--color-ink-700)', marginBottom: '16px' }}>
                  <strong>Beneficios:</strong> {plan.benefits}
                </div>
              )}

              {isAdmin() && (
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <button
                    onClick={() => openEditModal(plan)}
                    className="btn btn-secondary"
                    style={{ flex: 1, minHeight: '36px', fontSize: '12px' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => togglePlanStatus(plan)}
                    className={`btn ${plan.status === 'ACTIVO' ? 'btn-secondary' : 'btn-accent'}`}
                    style={{ minHeight: '36px', fontSize: '12px' }}
                  >
                    {plan.status === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Plan */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '16px' }}>
              {editingPlan ? 'Editar Plan (Versión Inmutable)' : 'Nuevo Plan de Membresía (HU-06)'}
            </h2>

            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={handleSavePlan}>
              <div className="form-group">
                <label className="form-label">Nombre Comercial del Plan *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Plan VIP Semestral"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Detalle sobre el plan y su cobertura"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Duración (Días) *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio Regular (PEN) *</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0.10"
                    className="form-input"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Beneficios y Condiciones</label>
                <input
                  type="text"
                  className="form-input"
                  value={formBenefits}
                  onChange={(e) => setFormBenefits(e.target.value)}
                  placeholder="Ej. Acceso total, casillero, toalla"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
