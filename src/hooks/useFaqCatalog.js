import { useCallback, useEffect, useRef, useState } from 'react';
import { readFaqCatalog } from '../services/faqCatalog';
import { useAuth } from '../contexts/AuthContext';

export function useFaqCatalog() {
  const { token } = useAuth();
  const [catalog, setCatalog] = useState({ records: [], error: '', loading: true });
  const controller = useRef(null);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setCatalog(previous => ({ ...previous, loading: true, error: '' }));
    try {
      const records = await readFaqCatalog(token, request.signal);
      if (request.signal.aborted) return false;
      setCatalog({ records, error: '', loading: false });
      return true;
    } catch (error) {
      if (request.signal.aborted) return false;
      setCatalog(previous => ({ ...previous, error: error.message || 'No se pudo consultar el catálogo.', loading: false }));
      return false;
    }
  }, [token]);

  useEffect(() => {
    refresh();
    return () => controller.current?.abort();
  }, [refresh]);

  const applyRecord = (record) => {
    controller.current?.abort();
    setCatalog(previous => ({
      records: previous.records.some(item => item.id === record.id)
        ? previous.records.map(item => item.id === record.id ? record : item)
        : [...previous.records, record],
      error: '',
      loading: false,
    }));
  };

  return { ...catalog, refresh, applyRecord };
}
