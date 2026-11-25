import { MESSAGE_TYPES, readTemplateDrafts, validateTemplate } from './whatsappCommunications';

export const APPROVED_PREVIEWS_KEY = 'gymvip.approved-template-previews.v1';
export const PREVIEW_CHANGED_EVENT = 'gymvip-template-preview-changed';

export function readApprovedTemplatePreviews() {
  const stored = JSON.parse(localStorage.getItem(APPROVED_PREVIEWS_KEY) ?? '{}');
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) throw new Error('No se pudieron consultar las plantillas aprobadas.');
  return Object.fromEntries(MESSAGE_TYPES.map(type => [type.id,
    typeof stored[type.id] === 'string' && !validateTemplate(type, stored[type.id]) ? stored[type.id] : type.original]));
}

export function approveTemplatePreview(type) {
  const text = readTemplateDrafts()[type.id];
  if (typeof text !== 'string' || validateTemplate(type, text)) throw new Error('Guarda un borrador válido antes de aprobarlo.');
  const approved = { ...readApprovedTemplatePreviews(), [type.id]: text };
  localStorage.setItem(APPROVED_PREVIEWS_KEY, JSON.stringify(approved));
  window.dispatchEvent(new Event(PREVIEW_CHANGED_EVENT));
  return approved;
}
