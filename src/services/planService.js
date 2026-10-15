// ==============================================================================
// GYM VIP — Servicio de Gestión de Planes y Tarifas (HU-06)
// ==============================================================================

import { listPlansApi, getPlanByIdApi, createPlanApi, updatePlanApi, setPlanStatusApi } from '../api/planApi';
import { validatePlanInputs } from '../validators/planValidator';

export async function fetchPlans(status = null, token = null) {
  return await listPlansApi(status, token);
}

export async function fetchPlanById(id, token = null) {
  return await getPlanByIdApi(id, token);
}

export async function createNewPlan(planData, token = null) {
  const errors = validatePlanInputs(planData.name, planData.durationDays, planData.pricePen);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  const payload = {
    name: planData.name.trim(),
    description: planData.description ? planData.description.trim() : '',
    durationDays: parseInt(planData.durationDays, 10),
    pricePen: parseFloat(planData.pricePen),
    benefits: planData.benefits ? planData.benefits.trim() : '',
  };

  return await createPlanApi(payload, token);
}

export async function updateExistingPlan(id, planData, token = null) {
  const errors = validatePlanInputs(planData.name, planData.durationDays, planData.pricePen);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  const payload = {
    name: planData.name.trim(),
    description: planData.description ? planData.description.trim() : '',
    durationDays: parseInt(planData.durationDays, 10),
    pricePen: parseFloat(planData.pricePen),
    benefits: planData.benefits ? planData.benefits.trim() : '',
  };

  return await updatePlanApi(id, payload, token);
}

export async function togglePlanStatus(id, currentStatus, token = null) {
  const nextStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  return await setPlanStatusApi(id, nextStatus, token);
}
