// ==============================================================================
// GYM VIP — Hook de Gestión de Clientes / Socios (HU-01)
// ==============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchClients } from '../services/clientService';

export function useClients(token) {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [page, setPage] = useState(0);
  const [totalElements,setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const sequence = useRef(0);

  const loadClients = useCallback(async (query = searchQuery, nextPage = page) => {
    const request = ++sequence.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients(query, nextPage, 20, token);
      if (request === sequence.current) { setClients(data.content || []); setPage(nextPage); setTotalPages(data.totalPages); setTotalElements(data.totalElements); }
    } catch (err) {
      if (request === sequence.current) { setError(err.message); setClients([]); }
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [searchQuery, token, page]);

  useEffect(() => {
    loadClients(searchQuery, 0);
  }, [token]);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    loadClients(searchQuery, 0);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadClients('', 0);
  };

  return {
    clients,
    page,
    totalPages,
    totalElements,
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
