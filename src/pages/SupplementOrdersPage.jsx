// ==============================================================================
// GYM VIP — Gestión Administrativa de Pedidos de Suplementos y Retiro en Mostrador
// Bandejas: Pagos por Verificar, Por Preparar, Retiro en Mostrador / QR, Historial
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  listAdminOrdersApi,
  getAdminOrderApi,
  approveOrderPaymentApi,
  rejectOrderPaymentApi,
  markOrderReadyForPickupApi,
  inspectPickupTokenApi,
  deliverOrderByTokenApi,
  cleanupExpiredReservationsApi
} from '../api/supplementOrderApi';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import { formatCurrencyPen } from '../utils/formatters';

export default function SupplementOrdersPage() {
  const { token, isAdmin, isRecepcion } = useAuth();

  // Estados de interfaz y filtrado
  const [activeTab, setActiveTab] = useState('PAGADO_POR_VERIFICAR'); // 'PAGADO_POR_VERIFICAR' | 'CONFIRMADO_PREPARACION' | 'LISTO_PARA_RETIRO' | 'TODOS' | 'SCANNER'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Modal / Detalle de Pedido
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Formularios de acción
  const [approveAmount, setApproveAmount] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Escáner / Retiro en Mostrador
  const [inputToken, setInputToken] = useState('');
  const [scannedTicket, setScannedTicket] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Carga de lista según bandeja activa
  const loadOrders = useCallback(async () => {
    if (activeTab === 'SCANNER') return;
    setLoading(true);
    setError('');
    try {
      const data = await listAdminOrdersApi(activeTab, token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar pedidos.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, reloadKey]);

  // Selección de pedido para ver detalle
  const handleSelectOrder = async (orderId) => {
    setDetailLoading(true);
    setError('');
    try {
      const detail = await getAdminOrderApi(orderId, token);
      setSelectedOrder(detail);
      setApproveAmount(detail.totalPen != null ? String(detail.totalPen) : '');
      setApproveNotes('');
      setRejectReason('');
    } catch (err) {
      setError(err.message || 'Error al cargar detalle del pedido.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Aprobación de pago (Solo ADMIN)
  const handleApprovePayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    setError('');
    try {
      const numAmount = parseFloat(approveAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Ingrese un monto verificado válido en soles (PEN).');
      }
      const updated = await approveOrderPaymentApi(selectedOrder.id, {
        verifiedAmountPen: numAmount,
        notes: approveNotes.trim(),
      }, token);
      setNotice(`Pago verificado para el pedido ${updated.orderNumber}. Pedido enviado a preparación.`);
      setSelectedOrder(updated);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'Error al verificar pago.');
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazo de pago (Solo ADMIN)
  const handleRejectPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!rejectReason.trim()) {
      setError('Debe especificar un motivo de rechazo claro.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const updated = await rejectOrderPaymentApi(selectedOrder.id, {
        reason: rejectReason.trim(),
      }, token);
      setNotice(`Comprobante rechazado para el pedido ${updated.orderNumber}. Stock liberado.`);
      setSelectedOrder(updated);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'Error al rechazar pago.');
    } finally {
      setActionLoading(false);
    }
  };

  // Marcar como Listo para Retiro (ADMIN y RECEPCION)
  const handleMarkReady = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await markOrderReadyForPickupApi(selectedOrder.id, token);
      setNotice(`El pedido ${updated.orderNumber} está listo para entrega. Ticket QR generado.`);
      setSelectedOrder(updated);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'Error al marcar listo para retiro.');
    } finally {
      setActionLoading(false);
    }
  };

  // Inspección manual o por QR en mostrador
  const handleInspectToken = async (e) => {
    if (e) e.preventDefault();
    if (!inputToken.trim()) {
      setError('Ingrese o escanee el token de retiro del cliente.');
      return;
    }
    setActionLoading(true);
    setError('');
    setScannedTicket(null);
    try {
      const ticket = await inspectPickupTokenApi(inputToken.trim(), token);
      setScannedTicket(ticket);
    } catch (err) {
      setError(err.message || 'Ticket no válido o no encontrado.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirmar Entrega Física (ADMIN y RECEPCION)
  const handleConfirmDelivery = async () => {
    if (!scannedTicket) return;
    if (scannedTicket.isConsumed) {
      setError('Este ticket ya fue entregado y no puede confirmarse nuevamente.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const delivered = await deliverOrderByTokenApi(scannedTicket.pickupToken, {
        verificationNotes: deliveryNotes.trim() || 'Entrega física en mostrador confirmada.',
      }, token);
      setNotice(`¡Entrega exitosa! Pedido ${delivered.orderNumber} entregado al socio.`);
      setScannedTicket(null);
      setInputToken('');
      setDeliveryNotes('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'Error al confirmar la entrega física.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mantenimiento de reservas expiradas
  const handleCleanupExpired = async () => {
    setActionLoading(true);
    try {
      const res = await cleanupExpiredReservationsApi(token);
      setNotice(`Mantenimiento ejecutado: ${res.releasedCount} reservas expiradas liberadas.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'Error al ejecutar limpieza.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="catalog-page" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="catalog-page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div className="catalog-eyebrow" style={{ color: '#D4AF37', fontWeight: 600, letterSpacing: '1px' }}>
            VIP CENTER FIT / PEDIDOS Y RETIROS
          </div>
          <h1 style={{ margin: '0.25rem 0', color: '#F3F4F6' }}>Bandeja de Pedidos de Suplementos</h1>
          <p style={{ color: '#9CA3AF', margin: 0 }}>
            Verificación de pagos Yape/Plin/Transferencia, preparación de pedidos y entrega segura con Ticket QR.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={handleCleanupExpired} disabled={actionLoading}>
            ⏱ Liberar Reservas Expiradas
          </Button>
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
            ↻ Actualizar
          </Button>
        </div>
      </div>

      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}
      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}

      {/* Selector de Bandejas */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setActiveTab('PAGADO_POR_VERIFICAR'); setSelectedOrder(null); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'PAGADO_POR_VERIFICAR' ? '#D4AF37' : '#1F2937',
            color: activeTab === 'PAGADO_POR_VERIFICAR' ? '#111827' : '#E5E7EB',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          💳 Pagos por Verificar
        </button>
        <button
          onClick={() => { setActiveTab('CONFIRMADO_PREPARACION'); setSelectedOrder(null); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'CONFIRMADO_PREPARACION' ? '#D4AF37' : '#1F2937',
            color: activeTab === 'CONFIRMADO_PREPARACION' ? '#111827' : '#E5E7EB',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📦 Por Preparar
        </button>
        <button
          onClick={() => { setActiveTab('LISTO_PARA_RETIRO'); setSelectedOrder(null); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'LISTO_PARA_RETIRO' ? '#D4AF37' : '#1F2937',
            color: activeTab === 'LISTO_PARA_RETIRO' ? '#111827' : '#E5E7EB',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🏷 Listos para Retiro
        </button>
        <button
          onClick={() => { setActiveTab('SCANNER'); setSelectedOrder(null); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'SCANNER' ? '#10B981' : '#1F2937',
            color: activeTab === 'SCANNER' ? '#FFFFFF' : '#E5E7EB',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📷 Mostrador / Lector QR
        </button>
        <button
          onClick={() => { setActiveTab('TODOS'); setSelectedOrder(null); }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'TODOS' ? '#D4AF37' : '#1F2937',
            color: activeTab === 'TODOS' ? '#111827' : '#E5E7EB',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📋 Historial Completo
        </button>
      </div>

      {/* Contenido: Modo Escáner / Retiro Mostrador */}
      {activeTab === 'SCANNER' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 450px) 1fr', gap: '1.5rem' }}>
          <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
            <h2 style={{ color: '#F9FAFB', fontSize: '1.25rem', marginTop: 0 }}>Lector de Código QR / Retiro</h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
              Ingrese o escanee el código del ticket presentado por el socio en su app móvil.
            </p>
            <form onSubmit={handleInspectToken}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#D1D5DB', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Código o Token de Retiro (Ej: rtk_...):
                </label>
                <input
                  type="text"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Escanee o pegue aquí el código"
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: '#111827',
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    color: '#F9FAFB',
                    fontFamily: 'monospace',
                    fontSize: '1rem'
                  }}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={actionLoading || !inputToken.trim()}>
                {actionLoading ? 'Consultando…' : 'Inspeccionar Ticket'}
              </Button>
            </form>
          </div>

          <div>
            {scannedTicket ? (
              <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '8px', border: '2px solid #D4AF37' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 600 }}>TICKET DE RETIRO FÍSICO</span>
                    <h2 style={{ margin: '0.2rem 0', color: '#FFFFFF' }}>Pedido {scannedTicket.orderNumber}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: scannedTicket.isConsumed ? '#EF4444' : '#10B981',
                      color: '#FFFFFF'
                    }}>
                      {scannedTicket.isConsumed ? 'ENTREGADO / CONSUMIDO' : 'DISPONIBLE PARA ENTREGA'}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0.25rem 0', color: '#D1D5DB' }}>
                    <strong>Socio:</strong> {scannedTicket.clientName} ({scannedTicket.clientDocumentMasked})
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#D1D5DB' }}>
                    <strong>Total Pagado:</strong> {formatCurrencyPen(scannedTicket.totalPen)}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
                    <strong>Emitido:</strong> {scannedTicket.issuedAtUtc || 'Reciente'}
                  </p>
                </div>

                <h3 style={{ color: '#F3F4F6', fontSize: '1rem', borderBottom: '1px solid #374151', paddingBottom: '0.4rem' }}>
                  Suplementos a Entregar:
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 1.5rem 0' }}>
                  {(scannedTicket.items || []).map((it) => (
                    <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1F2937' }}>
                      <span style={{ color: '#E5E7EB' }}>
                        {it.quantity}x {it.productName} ({it.productBrand} - {it.productPresentation} {it.productFlavor ? `· ${it.productFlavor}` : ''})
                      </span>
                      <span style={{ color: '#D4AF37', fontWeight: 600 }}>{formatCurrencyPen(it.lineTotalPen)}</span>
                    </li>
                  ))}
                </ul>

                {!scannedTicket.isConsumed ? (
                  <div style={{ background: '#1F2937', padding: '1rem', borderRadius: '6px' }}>
                    <label style={{ display: 'block', color: '#D1D5DB', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      Notas de verificación física (opcional):
                    </label>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Ej: DNI contrastado, socio retiró en persona"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: '#111827',
                        border: '1px solid #4B5563',
                        borderRadius: '4px',
                        color: '#F9FAFB',
                        marginBottom: '1rem'
                      }}
                    />
                    <Button onClick={handleConfirmDelivery} disabled={actionLoading}>
                      {actionLoading ? 'Procesando entrega…' : '✓ Confirmar Entrega Física'}
                    </Button>
                  </div>
                ) : (
                  <Alert variant="danger" message={`Este ticket ya fue consumido el ${scannedTicket.consumedAtUtc}. No entregue productos nuevamente.`} />
                )}
              </div>
            ) : (
              <div style={{ background: '#1F2937', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF' }}>
                <p>Escanee un código QR en recepción para validar la orden del socio.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Contenido: Tablas de Pedidos */
        <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 450px' : '1fr', gap: '1.5rem' }}>
          <div>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Cargando pedidos…</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#1F2937', borderRadius: '8px', color: '#9CA3AF' }}>
                No hay pedidos en la bandeja seleccionada.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', background: '#1F2937', borderRadius: '8px', border: '1px solid #374151' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #374151', color: '#9CA3AF' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Pedido</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Socio</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Método</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Estado Pedido</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Estado Pago</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid #2D3748', color: '#F3F4F6' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{ord.orderNumber}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div>{ord.clientName}</div>
                          <small style={{ color: '#9CA3AF' }}>{ord.clientPhone || ord.clientDocumentMasked}</small>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#D4AF37' }}>
                          {formatCurrencyPen(ord.totalPen)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{ord.paymentMethod}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: ord.orderStatus === 'ENTREGADO' ? '#065F46' : ord.orderStatus === 'LISTO_PARA_RETIRO' ? '#1E40AF' : '#374151',
                            color: '#FFFFFF'
                          }}>
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: ord.paymentStatus === 'VERIFICADO' ? '#065F46' : ord.paymentStatus === 'EVIDENCIA_SUBIDA' ? '#92400E' : '#374151',
                            color: '#FFFFFF'
                          }}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Button variant="secondary" onClick={() => handleSelectOrder(ord.id)}>
                            Ver Detalle
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel Lateral: Detalle del Pedido Seleccionado */}
          {selectedOrder && (
            <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '8px', border: '1px solid #4B5563', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>
                <h2 style={{ margin: 0, color: '#F9FAFB', fontSize: '1.15rem' }}>Detalle {selectedOrder.orderNumber}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '1.25rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <div style={{ color: '#9CA3AF' }}>Cargando detalle…</div>
              ) : (
                <div>
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#D1D5DB' }}>
                    <p style={{ margin: '0.2rem 0' }}><strong>Socio:</strong> {selectedOrder.clientName}</p>
                    <p style={{ margin: '0.2rem 0' }}><strong>Documento:</strong> {selectedOrder.clientDocumentMasked}</p>
                    <p style={{ margin: '0.2rem 0' }}><strong>Teléfono:</strong> {selectedOrder.clientPhone || 'No registrado'}</p>
                    <p style={{ margin: '0.2rem 0' }}><strong>Total:</strong> <span style={{ color: '#D4AF37', fontWeight: 600 }}>{formatCurrencyPen(selectedOrder.totalPen)}</span></p>
                    <p style={{ margin: '0.2rem 0' }}><strong>Método:</strong> {selectedOrder.paymentMethod}</p>
                    <p style={{ margin: '0.2rem 0' }}><strong>Referencia de Pago:</strong> {selectedOrder.paymentReference || 'Pendiente'}</p>
                    {selectedOrder.paymentEvidenceUrl && (
                      <p style={{ margin: '0.4rem 0' }}>
                        <a href={selectedOrder.paymentEvidenceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', textDecoration: 'underline' }}>
                          Ver Comprobante Adjunto ↗
                        </a>
                      </p>
                    )}
                  </div>

                  <h4 style={{ color: '#E5E7EB', margin: '0.75rem 0 0.5rem 0', borderTop: '1px solid #374151', paddingTop: '0.75rem' }}>
                    Productos Solicitados:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', fontSize: '0.85rem' }}>
                    {(selectedOrder.items || []).map((it) => (
                      <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #1F2937' }}>
                        <span style={{ color: '#D1D5DB' }}>{it.quantity}x {it.productName} ({it.productPresentation})</span>
                        <span style={{ color: '#D4AF37' }}>{formatCurrencyPen(it.lineTotalPen)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Acciones de Flujo */}
                  {selectedOrder.orderStatus === 'PAGADO_POR_VERIFICAR' && isAdmin() && (
                    <div style={{ background: '#1F2937', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                      <h4 style={{ color: '#D4AF37', margin: '0 0 0.5rem 0' }}>Validación de Comprobante</h4>
                      <form onSubmit={handleApprovePayment}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem' }}>Monto Verificado en Caja (S/):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={approveAmount}
                            onChange={(e) => setApproveAmount(e.target.value)}
                            style={{ width: '100%', padding: '0.4rem', background: '#111827', border: '1px solid #4B5563', borderRadius: '4px', color: '#FFF' }}
                            required
                          />
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem' }}>Notas:</label>
                          <input
                            type="text"
                            value={approveNotes}
                            onChange={(e) => setApproveNotes(e.target.value)}
                            placeholder="Ej: Confirmado en cuenta BCP"
                            style={{ width: '100%', padding: '0.4rem', background: '#111827', border: '1px solid #4B5563', borderRadius: '4px', color: '#FFF' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button type="submit" disabled={actionLoading}>
                            Aprobar Pago
                          </Button>
                        </div>
                      </form>

                      <div style={{ marginTop: '1rem', borderTop: '1px solid #374151', paddingTop: '0.75rem' }}>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Motivo de rechazo"
                          style={{ width: '100%', padding: '0.4rem', background: '#111827', border: '1px solid #4B5563', borderRadius: '4px', color: '#FFF', marginBottom: '0.5rem' }}
                        />
                        <Button variant="danger" onClick={handleRejectPayment} disabled={actionLoading || !rejectReason.trim()}>
                          Rechazar Pago
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.orderStatus === 'CONFIRMADO_PREPARACION' && (
                    <div style={{ background: '#1F2937', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                      <p style={{ color: '#D1D5DB', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
                        El pago está verificado. Una vez empaquetados los productos, marque el pedido como listo para generar el ticket QR del socio.
                      </p>
                      <Button onClick={handleMarkReady} disabled={actionLoading}>
                        Empaquetado Listo para Retiro
                      </Button>
                    </div>
                  )}

                  {selectedOrder.hasPickupToken && (
                    <div style={{ background: '#064E3B', padding: '0.75rem', borderRadius: '6px', color: '#A7F3D0', fontSize: '0.85rem' }}>
                      ✓ Ticket QR de retiro emitido para el socio. Puede reclamarlo en mostrador.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
