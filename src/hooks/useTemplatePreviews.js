import { useEffect, useState } from 'react';
import { MESSAGE_TYPES } from '../services/whatsappCommunications';
import { APPROVED_PREVIEWS_KEY, PREVIEW_CHANGED_EVENT, readApprovedTemplatePreviews } from '../services/templatePreviews';

export function useTemplatePreviews() {
  const read = () => {
    try { return readApprovedTemplatePreviews(); }
    catch { return Object.fromEntries(MESSAGE_TYPES.map(type => [type.id, type.original])); }
  };
  const [approved, setApproved] = useState(read);
  useEffect(() => {
    const refresh = event => { if (!event.key || event.key === APPROVED_PREVIEWS_KEY) setApproved(read()); };
    window.addEventListener('storage', refresh);
    window.addEventListener(PREVIEW_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(PREVIEW_CHANGED_EVENT, refresh);
    };
  }, []);
  return approved;
}
