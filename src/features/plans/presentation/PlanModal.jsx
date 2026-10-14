import React, { useState, useEffect } from 'react';
import { validatePlanInputs } from '../domain/plan';
import { createPlanApi, updatePlanApi } from '../infrastructure/planApi';

export default function PlanModal({ plan, token, onClose, onSuccess }) {
  const isEditing = Boolean(plan);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [pricePen, setPricePen] = useState('120.00');
  const [benefits, setBenefits] = useState('Acceso libre a sala de pesas y cardio');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (plan) {
      setName(plan.name || '');
      setDescription(plan.description || '');
      setDurationDays(String(plan.durationDays || '30'));
      setPricePen(String(plan.pricePen || '120.00'));
      setBenefits(plan.benefits || '');
    }
  }, [plan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationErrors = validatePlanInputs(name, durationDays, pricePen);
    if (validationErrors.length > 0) {
      setErrorMsg(validationErrors.join(' '));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        durationDays: parseInt(durationDays, 10),
        pricePen: parseFloat(pricePen),
        benefits: benefits.trim(),
      };

      let result;
      if (isEditing) {
        result = await updatePlanApi(plan.id, payload, token);
      } else {
        result = await createPlanApi(payload, token);
      }

      onSuccess(result);
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
      <div className="modal-content" style={{ maxWidth: '540px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              HU-06 CATÁLOGO DE PLANES
            </span>
            <h2 id="plan-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              {isEditing ? `Modificar Plan (v${plan.version})` : 'Crear Nuevo Plan'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              {isEditing
                ? 'La actualización de condiciones económicas incrementa la versión y genera un histórico inmutable.'
                : 'Defina los términos del plan. La versión inicial v1 será resguardada.'}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{ minHeight: '36px', minWidth: '36px', padding: '6px' }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '16px' }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="plan-name">
              Nombre Comercial del Plan <span style={{ color: 'var(--color-gold)' }}>*</span>
            </label>
            <input
              id="plan-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Plan Mensual Full Gym"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-duration">
                Duración (Días) <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                id="plan-duration"
                type="number"
                min="1"
                className="form-input"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                Estándar mensual = 30 días
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="plan-price">
                Precio (PEN - Soles) <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                id="plan-price"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={pricePen}
                onChange={(e) => setPricePen(e.target.value)}
                placeholder="120.00"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="plan-desc">
              Descripción General
            </label>
            <input
              id="plan-desc"
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Acceso total a todas las máquinas y casilleros"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="plan-benefits">
              Beneficios Incluidos
            </label>
            <textarea
              id="plan-benefits"
              className="form-input"
              rows={3}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Evaluación física gratuita, acceso a zona húmeda, wifi de alta velocidad"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ minHeight: '42px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minHeight: '42px' }}
            >
              {submitting
                ? 'Guardando...'
                : isEditing
                ? `Actualizar a v${(plan.version || 1) + 1}`
                : 'Crear Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
