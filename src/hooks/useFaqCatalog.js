import { useCallback, useEffect, useState } from 'react';
import { readFaqCatalog, watchFaqCatalog } from '../services/faqCatalog';

export function useFaqCatalog() {
  const [catalog, setCatalog] = useState({ records: [], error: '' });
  const refresh = useCallback(() => {
    try {
      setCatalog({ records: readFaqCatalog(), error: '' });
      return true;
    } catch {
      setCatalog({ records: [], error: 'No se pudo leer el catálogo guardado en este navegador.' });
      return false;
    }
  }, []);

  useEffect(() => {
    refresh();
    return watchFaqCatalog(refresh);
  }, [refresh]);

  return { ...catalog, refresh };
}
