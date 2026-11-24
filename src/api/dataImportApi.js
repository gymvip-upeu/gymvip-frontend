// ==============================================================================
// GYM VIP — API: dataImportApi.js
// Cliente HTTP para el Centro de Importación y Migración Masiva Integral (Fase 5)
// ==============================================================================

import { httpClient } from './httpClient.js';

export async function downloadDataImportTemplate(type = 'empty', token) {
  const response = await httpClient(`/api/v1/data-import/templates/${type}`, {}, token);
  if (!response.ok) {
    throw new Error('No se pudo descargar la plantilla Excel del servidor.');
  }
  return response.blob();
}

export async function previewDataImportApi(file, token) {
  if (!file) {
    throw new Error('Selecciona un archivo Excel (.xlsx) o CSV para analizar.');
  }
  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient(
    '/api/v1/data-import/preview',
    {
      method: 'POST',
      body: formData,
    },
    token
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al procesar la vista previa de la importación.');
  }
  return response.json();
}

export async function confirmDataImportApi(file, mode = 'CREATE_UPDATE', decisions = [], token) {
  if (!file) {
    throw new Error('No se ha proporcionado el archivo para confirmar la importación.');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  if (Array.isArray(decisions) && decisions.length > 0) {
    formData.append('decisions', JSON.stringify(decisions));
  }

  const response = await httpClient(
    '/api/v1/data-import/confirm',
    {
      method: 'POST',
      body: formData,
    },
    token
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al persistir la importación en la base de datos.');
  }
  return response.json();
}

export async function getDataImportHistoryApi(token) {
  const response = await httpClient('/api/v1/data-import/history', {}, token);
  if (!response.ok) {
    throw new Error('No se pudo obtener el historial de importaciones.');
  }
  return response.json();
}
