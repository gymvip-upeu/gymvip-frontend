import { httpClient } from './httpClient.js';

async function request(path, token, options = {}) {
  const response = await httpClient(path, options, token);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.message || 'No se pudo consultar o guardar el catálogo de preguntas frecuentes.');
    error.status = response.status;
    throw error;
  }
  if (!body) throw new Error('El servidor devolvió una respuesta incompleta. Actualiza el catálogo.');
  return body;
}

export const getFaqCatalogApi = (token, signal) => request('/api/v1/faqs', token, { signal });
export const createFaqApi = (content, token) => request('/api/v1/faqs', token, {
  method: 'POST', body: JSON.stringify(content),
});
export const editFaqApi = (id, revision, content, token) => request(`/api/v1/faqs/${encodeURIComponent(id)}`, token, {
  method: 'PUT', body: JSON.stringify({ revision, content }),
});
export const transitionFaqApi = (id, revision, action, token) => request(
  `/api/v1/faqs/${encodeURIComponent(id)}/${action}`, token, {
    method: 'POST', body: JSON.stringify({ revision }),
  }
);
