// ==============================================================================
// GYM VIP — Modal de Configuración y Tarifario de Planes
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { createNewPlan, updateExistingPlan } from '../../services/planService';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';

export default function PlanModal({ plan, token, onClose, onSuccess }) {
  const isEditing = Boolean(plan);

  const [values, setValues] = useState({
    name: plan?.name || '',
    pricePen: plan?.pricePen !== undefined ? String(plan.pricePen) : '120.00',
    durationDays: plan?.durationDays !== undefined ? String(plan.durationDays) : '30',
    description: plan?.description || '',
    benefits: plan?.benefits || 'Acceso libre a sala de pesas y cardio',
    conditions: plan?.conditions || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('input')?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !dialogRef.current?.dataset?.busy) {
        closeRef.current();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const nodes = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
        if (nodes.length === 0) return;
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes[nodes.length - 1]?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, []);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleQuickDuration = (e) => {
    const val = e.target.value;
    if (val !== 'custom') {
      setValues((prev) => ({ ...prev, durationDays: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description ? values.description.trim() : null,
        durationDays: parseInt(values.durationDays, 10),
        pricePen: parseFloat(values.pricePen),
        benefits: values.benefits ? values.benefits.trim() : null,
        conditions: values.conditions ? values.conditions.trim() : null,
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

  const currentDurationNum = Number(values.durationDays);
  const selectedType = [30, 90, 180, 365].includes(currentDurationNum) ? String(currentDurationNum) : 'custom';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
      <div
        className="modal-content"
        ref={dialogRef}
        data-busy={submitting ? 'true' : undefined}
        style={{ maxWidth: '560px', padding: '32px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              GESTIÓN DE PLAN Y TARIFAS
            </span>
            <h2 id="plan-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              {isEditing ? `Editar Tarifa: ${plan.name}` : 'Crear Nuevo Plan de Membresía'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              {isEditing
                ? 'Toda modificación incrementará el número de versión conservando el histórico.'
                : 'Configure las condiciones y periodicidad de la membresía en moneda nacional.'}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Cerrar modal"
            disabled={submitting}
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
              value={values.name}
              onChange={handleChange('name')}
              placeholder="Ej. Plan Black Mensual VIP"
              maxLength={120}
              required
              disabled={submitting}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-type">
                Tipo / Periodicidad
              </label>
              <select
                id="plan-type"
                className="form-input"
                value={selectedType}
                onChange={handleQuickDuration}
                disabled={submitting}
              >
                <option value="30">Mensual (30 días)</option>
                <option value="90">Trimestral (90 días)</option>
                <option value="180">Semestral (180 días)</option>
                <option value="365">Anual (365 días)</option>
                <option value="custom">Personalizado (días exactos)</option>
              </select>
            </div>

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
                value={values.pricePen}
                onChange={handleChange('pricePen')}
                placeholder="120.00"
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="plan-duration">
              Duración Exacta (Días Consecutivos) *
            </label>
            <input
              id="plan-duration"
              type="number"
              min="1"
              step="1"
              className="form-input"
              value={values.durationDays}
              onChange={handleChange('durationDays')}
              placeholder="30"
              required
              disabled={submitting}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Se computan días consecutivos. Mensual: 30; trimestral: 90; anual: 365 días.
            </span>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="plan-description">
              Descripción Breve
            </label>
            <input
              id="plan-description"
              type="text"
              className="form-input"
              maxLength={500}
              value={values.description}
              onChange={handleChange('description')}
              placeholder="Ej. Acceso irrestricto a todas las sedes y máquinas de fuerza"
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="plan-benefits">
              Beneficios Incluidos
            </label>
            <textarea
              id="plan-benefits"
              className="form-input"
              rows={2}
              maxLength={1000}
              value={values.benefits}
              onChange={handleChange('benefits')}
              placeholder="Detalle de beneficios incluidos, acceso a áreas, etc."
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="plan-conditions">
              Condiciones y Restricciones
            </label>
            <textarea
              id="plan-conditions"
              className="form-input"
              rows={2}
              maxLength={1000}
              value={values.conditions}
              onChange={handleChange('conditions')}
              placeholder="Horarios permitidos, servicios y condiciones comerciales de uso..."
              disabled={submitting}
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
