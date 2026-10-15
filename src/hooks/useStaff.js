// ==============================================================================
// GYM VIP — Hook de Gestión de Personal y Roles (HU-04)
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { fetchStaffAccounts, modifyStaffRole, inactivateStaffAccount } from '../services/staffService';

export function useStaff(token, isAdmin) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStaffAccounts(token);
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    if (isAdmin) {
      loadAccounts();
    }
  }, [isAdmin, token]);

  const updateRole = async (accountId, role, email) => {
    setActionSubmitting(true);
    setError(null);
    try {
      await modifyStaffRole(accountId, role, token);
      setSuccessToast(`Rol de "${email}" actualizado a ${role}.`);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const inactivateAccount = async (account) => {
    if (!account) return;
    setActionSubmitting(true);
    setError(null);
    try {
      await inactivateStaffAccount(account.id, token);
      setSuccessToast(`Cuenta de "${account.email}" ha sido inactivada.`);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  return {
    accounts,
    loading,
    error,
    setError,
    successToast,
    setSuccessToast,
    actionSubmitting,
    loadAccounts,
    updateRole,
    inactivateAccount,
  };
}

export default useStaff;
