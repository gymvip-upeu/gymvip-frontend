// ==============================================================================
// GYM VIP — Servicio de Importación Masiva de Clientes (HU-06 / Sprint 1)
// Conexión con endpoints /api/v1/clients/import (plantilla, vista previa y confirmación)
// Compatible con desarrollo local (proxy Vite) y despliegue Vercel/Render
// ==============================================================================

import { config } from '../config/environment.js';

const getEndpoint = (path) => `${config.apiBaseUrl}/api/v1/clients/import${path}`;

export async function downloadClientTemplate(token) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(getEndpoint('/template'), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'Error al descargar la plantilla de importación.';
    try {
      const errJson = await response.json();
      errorMsg = errJson.message || errorMsg;
    } catch {
      // Ignorar error al parsear JSON
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_importacion_clientes.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function previewClientImport(file, token) {
  if (!file) {
    throw new Error('Debe seleccionar un archivo .xlsx para validar.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // IMPORTANTE: Para peticiones FormData, NUNCA fijar manualmente 'Content-Type'.
  // El navegador añade automáticamente 'multipart/form-data; boundary=...'
  const response = await fetch(getEndpoint('/preview'), {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || 'Error al procesar la vista previa del archivo Excel.';
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return data;
}

export async function confirmClientImport(file, token) {
  if (!file) {
    throw new Error('Debe proporcionar el archivo validado para confirmar la importación.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // IMPORTANTE: Para peticiones FormData, NUNCA fijar manualmente 'Content-Type'.
  const response = await fetch(getEndpoint('/confirm'), {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || 'Error al persistir la importación masiva de clientes.';
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return data;
}

export default {
  downloadClientTemplate,
  previewClientImport,
  confirmClientImport,
};
