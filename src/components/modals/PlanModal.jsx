// ==============================================================================
// GYM VIP — Modal de Creación y Edición de Planes (HU-06)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { createNewPlan, updateExistingPlan } from '../../services/planService';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';

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

    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        durationDays,
        pricePen,
        benefits,
      };

      let result;
      if (isEditing) {
        result = await updateExistingPlan(plan.id, payload, token);
      } else {
        result = await createNewPlan(payload, token);
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
      <div className="modal-content" style={{ maxWidth: '520px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              HU-06 CATÁLOGO Y TARIFAS
            </span>
            <h2 id="plan-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              {isEditing ? `Editar Tarifa: ${plan.name}` : 'Crear Nuevo Plan de Membresía'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              {isEditing
                ? 'Toda modificación incrementará el número de versión conservando el histórico.'
                : 'Configure las condiciones estándar de la membresía en moneda nacional.'}
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

        {errorMsg && <Alert variant="danger" message={errorMsg} onClose={() => setErrorMsg(null)} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="plan-name">
              Nombre Comercial del Plan *
            </label>
            <input
              id="plan-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Plan Black Mensual VIP"
              required
              autoFocus
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Regla de negocio: Si contiene la denominación mensual, debe tener exactamente 30 días de duración.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-price">
                Precio Estándar (PEN / Soles) *
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

            <div className="form-group">
              <label className="form-label" htmlFor="plan-duration">
                Duración (Días) *
              </label>
              <input
                id="plan-duration"
                type="number"
                min="1"
                className="form-input"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="30"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="plan-description">
              Descripción Breve
            </label>
            <input
              id="plan-description"
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Acceso irrestricto a todas las sedes y máquinas de fuerza"
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="plan-benefits">
              Beneficios y Condiciones de Servicio
            </label>
            <textarea
              id="plan-benefits"
              className="form-input"
              rows={3}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Detalle de beneficios incluidos, horarios y restricciones"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : isEditing ? 'Actualizar Tarifa' : 'Crear Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
