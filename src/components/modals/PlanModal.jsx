import React, { useEffect, useRef, useState } from 'react';
import { createNewPlan, updateExistingPlan } from '../../services/planService';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';

export default function PlanModal({ plan, token, onClose, onSuccess }) {
  const [values, setValues] = useState({ name: plan?.name || '', pricePen: plan?.pricePen ?? '', durationDays: plan?.durationDays ?? 30, description: plan?.description || '', benefits: plan?.benefits || '', conditions: plan?.conditions || '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const dialog = useRef(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement; const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current.querySelector('input')?.focus();
    const keydown = e => {
      if (e.key === 'Escape' && !dialog.current.dataset.busy) close.current();
      if (e.key === 'Tab') {
        const nodes = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
        if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1)?.focus(); }
        else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  const field = key => ({ value: values[key], onChange: e => setValues(v => ({ ...v, [key]: e.target.value })) });
  async function submit(e) {
    e.preventDefault(); setSubmitting(true); setError(null);
    try { const result = plan ? await updateExistingPlan(plan.id, values, token) : await createNewPlan(values, token); onSuccess(result); }
    catch (err) { setError(err.message); } finally { setSubmitting(false); }
  }
  return <div className="modal-overlay plan-modal-overlay"><div className="modal-content plan-modal" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title" ref={dialog} data-busy={submitting ? 'true' : undefined}>
    <div className="plan-modal-heading"><div><h2 id="plan-modal-title">{plan ? 'Editar plan' : 'Nuevo plan'}</h2><p>{plan ? 'Actualiza las condiciones para las próximas membresías.' : 'Configura el nuevo plan para tus miembros.'}</p></div><button className="plan-close" aria-label="Cerrar formulario" disabled={submitting} onClick={onClose}>×</button></div>
    {error && <Alert variant="danger" message={error} />}
    <form onSubmit={submit}><fieldset disabled={submitting}>
      <label htmlFor="plan-name">Nombre del plan</label><input id="plan-name" className="form-input" placeholder="Ej. Plan trimestral" maxLength={120} required {...field('name')} />
      <div className="plan-form-row"><div><label htmlFor="plan-type">Tipo de plan</label><select id="plan-type" className="form-input" value={[30,90,180,365].includes(Number(values.durationDays)) ? String(values.durationDays) : 'custom'} onChange={e => { if(e.target.value !== 'custom') setValues(v => ({...v, durationDays:e.target.value})); else setValues(v => ({...v,durationDays:''})); }}><option value="30">Mensual</option><option value="90">Trimestral</option><option value="180">Semestral</option><option value="365">Anual</option><option value="custom">Personalizado</option></select></div><div><label htmlFor="plan-price">Precio (S/)</label><input id="plan-price" className="form-input" type="number" min="0.01" step="0.01" placeholder="150.00" required {...field('pricePen')} /></div></div>
      <label htmlFor="plan-duration">Duración (días)</label><input id="plan-duration" className="form-input" type="number" min="1" step="1" placeholder="Ej. 30" required {...field('durationDays')} /><p className="plan-help">Se cuentan días consecutivos. Mensual: 30 días; trimestral: 90; anual: 365. Puedes configurar otra duración.</p>
      <label htmlFor="plan-description">Descripción</label><textarea id="plan-description" className="form-input" rows={2} maxLength={500} placeholder="Describe el plan…" {...field('description')} />
      <label htmlFor="plan-benefits">Beneficios</label><textarea id="plan-benefits" className="form-input" rows={2} maxLength={1000} placeholder="Acceso, horarios y condiciones…" {...field('benefits')} />
      <label htmlFor="plan-conditions">Condiciones y restricciones</label><textarea id="plan-conditions" className="form-input" rows={2} maxLength={1000} placeholder="Horarios, servicios y condiciones de uso…" {...field('conditions')} />
      <div className="plan-form-actions"><Button type="button" variant="secondary" disabled={submitting} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={submitting}>{submitting ? 'Guardando…' : plan ? 'Guardar cambios' : 'Crear plan'}</Button></div>
    </fieldset></form>
  </div></div>;
}
