// ==============================================================================
// GYM VIP — Hook de Gestión de Catálogo de Planes (HU-06)
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { fetchPlans, togglePlanStatus } from '../services/planService';

export function usePlans(token) {
  const [plans, setPlans] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ACTIVO');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadPlans = useCallback(async (status = filterStatus) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlans(status, token);
      setPlans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, token]);

  useEffect(() => {
    loadPlans(filterStatus);
  }, [filterStatus, token]);

  const changePlanStatus = async (plan) => {
    if (!plan) return;
    setUpdatingStatus(true);
    try {
      await togglePlanStatus(plan.id, plan.status, token);
      const nextStatus = plan.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      setSuccessToast(`Plan "${plan.name}" ahora está ${nextStatus}.`);
      loadPlans(filterStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return {
    plans,
    filterStatus,
    setFilterStatus,
    loading,
    error,
    setError,
    successToast,
    setSuccessToast,
    updatingStatus,
    loadPlans,
    changePlanStatus,
  };
}

export default usePlans;
