// ==============================================================================
// GYM VIP — Hook de Gestión de Clientes / Socios (HU-01)
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import { fetchClients } from '../services/clientService';

export function useClients(token) {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const loadClients = useCallback(async (query = searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients(query, 0, 50, token);
      setClients(data.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, token]);

  useEffect(() => {
    loadClients(searchQuery);
  }, [token]);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    loadClients(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadClients('');
  };

  return {
    clients,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    setError,
    successToast,
    setSuccessToast,
    loadClients,
    handleSearchSubmit,
    handleClearSearch,
  };
}

export default useClients;
