// ==============================================================================
// GYM VIP — API de Gestión Administrativa de Pedidos de Suplementos y Retiro
// ==============================================================================

import { httpClient } from './httpClient.js';

export async function listAdminOrdersApi(statusOrParams = '', token = null, signal) {
  const params = new URLSearchParams();
  if (typeof statusOrParams === 'string') {
    if (statusOrParams && statusOrParams !== 'TODOS') {
      params.set('status', statusOrParams);
    }
  } else if (statusOrParams && typeof statusOrParams === 'object') {
    if (statusOrParams.status && statusOrParams.status !== 'TODOS') {
      params.set('status', String(statusOrParams.status));
    }
    if (Number.isInteger(statusOrParams.page) && statusOrParams.page >= 0) {
      params.set('page', String(statusOrParams.page));
    }
    if (Number.isInteger(statusOrParams.size) && statusOrParams.size > 0) {
      params.set('size', String(statusOrParams.size));
    }
  }
  const qs = params.toString();
  const query = qs ? `?${qs}` : '';
  const response = await httpClient(`/api/v1/admin/orders${query}`, { signal }, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al listar los pedidos de suplementos.');
  }
  return response.json();
}

export async function getAdminOrderApi(orderId, token = null) {
  const response = await httpClient(`/api/v1/admin/orders/${orderId}`, {}, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al obtener el detalle del pedido.');
  }
  return response.json();
}

export async function getAdminOrderPaymentLinkApi(orderId, token = null) {
  const response = await httpClient(`/api/v1/admin/orders/${orderId}/payment-link`, {}, token);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || 'No se pudo consultar el enlace de pago.');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function approveOrderPaymentApi(orderId, approvalData, token = null) {
  const response = await httpClient(`/api/v1/admin/orders/${orderId}/approve-payment`, {
    method: 'POST',
    body: JSON.stringify(approvalData),
  }, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al aprobar el pago del pedido.');
  }
  return response.json();
}

export async function rejectOrderPaymentApi(orderId, rejectionData, token = null) {
  const response = await httpClient(`/api/v1/admin/orders/${orderId}/reject-payment`, {
    method: 'POST',
    body: JSON.stringify(rejectionData),
  }, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al rechazar el comprobante de pago.');
  }
  return response.json();
}

export async function markOrderReadyForPickupApi(orderId, token = null) {
  const response = await httpClient(`/api/v1/admin/orders/${orderId}/ready-for-pickup`, {
    method: 'POST',
  }, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al marcar el pedido como listo para retiro.');
  }
  return response.json();
}

export async function inspectPickupTokenApi(tokenStr, token = null) {
  const response = await httpClient(`/api/v1/admin/orders/pickup/${encodeURIComponent(tokenStr)}`, {}, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Ticket de retiro no válido o no encontrado.');
  }
  return response.json();
}

export async function deliverOrderByTokenApi(tokenStr, deliveryData = {}, token = null) {
  const response = await httpClient(`/api/v1/admin/orders/pickup/${encodeURIComponent(tokenStr)}/deliver`, {
    method: 'POST',
    body: JSON.stringify(deliveryData),
  }, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al confirmar la entrega física del pedido.');
  }
  return response.json();
}

export async function cleanupExpiredReservationsApi(token = null) {
  const response = await httpClient('/api/v1/admin/orders/cleanup-expired', {
    method: 'POST',
  }, token);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al liberar pedidos expirados.');
  }
  return response.json();
}
