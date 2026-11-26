// ==============================================================================
// GYM VIP — Hook de Gestión de Personal, Roles RBAC y Auditoría (HU-04 / Enterprise)
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { fetchStaffAccounts, modifyStaffRole, modifyStaffProfile, inactivateStaffAccount } from '../services/staffService';
import { listRolesCatalogApi, listPermissionsCatalogApi, getStaffAuditHistoryApi } from '../api/staffApi';
import { isStaffAccount } from '../services/permissionsService';

export function useStaff(token, canManageStaff) {
  const [accounts, setAccounts] = useState([]);
  const [rolesCatalog, setRolesCatalog] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!canManageStaff) return;
    setLoading(true);
    setError(null);
    try {
      const [data, roles, perms, audit] = await Promise.all([
        fetchStaffAccounts(token),
        listRolesCatalogApi(token).catch(() => []),
        listPermissionsCatalogApi(token).catch(() => []),
        getStaffAuditHistoryApi(token).catch(() => []),
      ]);
      setAccounts(Array.isArray(data) ? data.filter(isStaffAccount) : []);
      setRolesCatalog(Array.isArray(roles) ? roles : []);
      setPermissionsCatalog(Array.isArray(perms) ? perms : []);
      setAuditEvents(Array.isArray(audit) ? audit : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canManageStaff, token]);

  useEffect(() => {
    if (canManageStaff) {
      loadAccounts();
    }
  }, [canManageStaff, loadAccounts]);

  const updateRole = async (accountId, role, email) => {
    setActionSubmitting(true);
    setError(null);
    try {
      await modifyStaffRole(accountId, role, token);
      setSuccessToast(`Rol de "${email}" actualizado a ${role}.`);
      await loadAccounts();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setActionSubmitting(false);
    }
  };

  const inactivateAccount = async (account) => {
    if (!account) return false;
    setActionSubmitting(true);
    setError(null);
    try {
      await inactivateStaffAccount(account.id, token);
      setSuccessToast(`Cuenta de "${account.email}" ha sido inactivada.`);
      await loadAccounts();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setActionSubmitting(false);
    }
  };

  const updateProfile = async (accountId, profile, newRole = null, originalRole = null) => {
    setActionSubmitting(true);
    setError(null);
    try {
      await modifyStaffProfile(accountId, profile, token);
      if (newRole && newRole !== originalRole) {
        await modifyStaffRole(accountId, newRole, token);
      }
      setSuccessToast('Datos y rol del colaborador actualizados.');
      await loadAccounts();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setActionSubmitting(false);
    }
  };

  return {
    accounts,
    rolesCatalog,
    permissionsCatalog,
    auditEvents,
    loading,
    error,
    setError,
    successToast,
    setSuccessToast,
    actionSubmitting,
    loadAccounts,
    updateRole,
    updateProfile,
    inactivateAccount,
  };
}

export default useStaff;
