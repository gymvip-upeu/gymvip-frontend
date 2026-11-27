// ==============================================================================
// GYM VIP — Gestión Administrativa de Pedidos de Suplementos y Retiro QR
// Tokenized Dark & Gold + Light Mode compatible; Escáner QR separado de colas
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  listAdminOrdersApi,
  getAdminOrderApi,
  getAdminOrderPaymentLinkApi,
  approveOrderPaymentApi,
  rejectOrderPaymentApi,
  markOrderReadyForPickupApi,
  inspectPickupTokenApi,
  deliverOrderByTokenApi,
  cleanupExpiredReservationsApi,
} from '../../api/supplementOrderApi';
import { Alert } from '../../components/common/Alert';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icons';
import { VipTabBar } from '../../components/common/VipTabBar';
import { formatCurrencyPen } from '../../utils/formatters';

const QUEUE_TABS = [
  { id: 'PENDIENTE_PAGO', label: 'Efectivo pendiente', icon: 'clock' },
  { id: 'PAGADO_POR_VERIFICAR', label: 'Pagos por Verificar', icon: 'credit-card' },
  { id: 'CONFIRMADO_PREPARACION', label: 'Por Preparar', icon: 'package' },
  { id: 'LISTO_PARA_RETIRO', label: 'Listos para Retiro', icon: 'tag' },
  { id: 'TODOS', label: 'Historial Completo', icon: 'bar-chart' },
];

export default function SupplementOrdersPage() {
  const { token, isBusinessExecutive, isRecepcion } = useAuth();
  const isExecutive = isBusinessExecutive();

  const [activeTab, setActiveTab] = useState('PENDIENTE_PAGO');
  const [scannerMode, setScannerMode] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queueError, setQueueError] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [digitalLink, setDigitalLink] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [approveAmount, setApproveAmount] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const [inputToken, setInputToken] = useState('');
  const [scannedTicket, setScannedTicket] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const loadOrders = useCallback(async (signal) => {
    if (!token || scannerMode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setQueueError('');
    try {
      const statusParam = activeTab === 'TODOS' ? undefined : activeTab;
      const res = await listAdminOrdersApi({ status: statusParam, page: 0, size: 30 }, token, signal);
      if (signal.aborted) return;
      const list = Array.isArray(res) ? res : res?.content;
      if (!Array.isArray(list)) throw new Error('La respuesta no contiene una lista de pedidos.');
      setOrders(list);
    } catch (err) {
      if (!signal.aborted) {
        setOrders([]);
        setQueueError(`Bandeja de pedidos: ${err.message || 'no se pudo cargar.'}`);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [token, activeTab, scannerMode, reloadKey]);

  useEffect(() => {
    const request = new AbortController();
    void loadOrders(request.signal);
    return () => request.abort();
  }, [loadOrders]);

  const handleSelectOrder = async (orderId) => {
    setDetailLoading(true);
    setError('');
    setDigitalLink(null);
    try {
      const detail = await getAdminOrderApi(orderId, token);
      setSelectedOrder(detail);
      setApproveAmount(detail.totalPen ? String(detail.totalPen) : '');
      setApproveNotes('');
      setRejectReason('');
      if (detail.paymentMethod === 'TARJETA_PASARELA') {
        try {
          setDigitalLink(await getAdminOrderPaymentLinkApi(orderId, token));
        } catch {
          setDigitalLink(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Error al cargar el detalle del pedido.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprovePayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    setError('');
    try {
      const cashCounter = selectedOrder.paymentMethod === 'EFECTIVO_MOSTRADOR';
      await approveOrderPaymentApi(
        selectedOrder.id,
        {
          verifiedAmountPen: parseFloat(approveAmount),
          notes: approveNotes.trim() || (cashCounter ? 'Cobro en efectivo confirmado en caja.' : 'Pago verificado por administración.'),
        },
        token
      );
      setNotice(
        cashCounter
          ? `Cobro en efectivo confirmado para ${selectedOrder.orderNumber}.`
          : `Pago aprobado para el pedido ${selectedOrder.orderNumber}. Pasa a preparación.`
      );
      setSelectedOrder(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'No se pudo aprobar el pago.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedOrder || !rejectReason.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await rejectOrderPaymentApi(selectedOrder.id, { reason: rejectReason.trim() }, token);
      setNotice(`Pago rechazado en pedido ${selectedOrder.orderNumber}. Reservas liberadas.`);
      setSelectedOrder(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'No se pudo rechazar el pago.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await markOrderReadyForPickupApi(selectedOrder.id, token);
      setNotice(`Pedido ${updated.orderNumber} listo para retiro. Ticket QR disponible para el socio.`);
      setSelectedOrder(updated);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'No se pudo marcar como listo para retiro.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectToken = async (e) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setActionLoading(true);
    setPickupError('');
    setScannedTicket(null);
    try {
      const ticket = await inspectPickupTokenApi(inputToken.trim(), token);
      setScannedTicket(ticket);
    } catch (err) {
      setPickupError(`Inspección del ticket: ${err.message || 'código inválido o no encontrado.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!scannedTicket) return;
    if (scannedTicket.isConsumed) {
      setPickupError('Este ticket ya fue entregado y no puede confirmarse nuevamente.');
      return;
    }
    setActionLoading(true);
    setPickupError('');
    try {
      const delivered = await deliverOrderByTokenApi(
        scannedTicket.pickupToken,
        { verificationNotes: deliveryNotes.trim() || 'Entrega física en mostrador confirmada.' },
        token
      );
      setNotice(`¡Entrega exitosa! Pedido ${delivered.orderNumber} entregado al socio.`);
      setScannedTicket(null);
      setInputToken('');
      setDeliveryNotes('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      setPickupError(`Confirmación de entrega: ${err.message || 'no se pudo confirmar.'}`);
    } finally {
      setActionLoading(false);
    }
  };

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
    <section className="catalog-page" style={{ padding: '1rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        className="catalog-page-heading"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '1.25rem' }}
      >
        <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px' }}>
          Verificación de pagos Yape/Plin/Transferencia, preparación de pedidos y entrega segura con Ticket QR.
        </p>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Button
            variant={scannerMode ? 'primary' : 'secondary'}
            onClick={() => {
              setScannerMode((prev) => !prev);
              setSelectedOrder(null);
              setError('');
              setPickupError('');
              setScannedTicket(null);
            }}
            disabled={actionLoading}
          >
            <Icon name="check-circle" size={15} />
            <span>{scannerMode ? 'Volver a Bandejas' : 'Mostrador / Lector QR'}</span>
          </Button>
          <Button variant="secondary" onClick={handleCleanupExpired} disabled={actionLoading}>
            <Icon name="clock" size={15} />
            <span>Liberar Expiradas</span>
          </Button>
          <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
            <Icon name="refresh" size={15} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}
      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {!scannerMode && queueError && <Alert variant="danger" message={queueError} onClose={() => setQueueError('')} />}
      {scannerMode && pickupError && <Alert variant="danger" message={pickupError} onClose={() => setPickupError('')} />}

      {!scannerMode && (
        <VipTabBar
          tabs={QUEUE_TABS}
          activeTab={activeTab}
          onChange={(nextTab) => {
            setActiveTab(nextTab);
            setSelectedOrder(null);
          }}
          ariaLabel="Estados de pedidos de suplementos"
        />
      )}

      {scannerMode ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.25rem', marginTop: 0 }}>
              Lector de Código QR / Retiro
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Ingrese o escanee el código del ticket presentado por el socio en su app móvil.
            </p>
            <form onSubmit={handleInspectToken}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="pickup-token-input">
                  Código o Token de Retiro (Ej: rtk_...):
                </label>
                <input
                  id="pickup-token-input"
                  type="text"
                  className="form-input"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Escanee o pegue aquí el código"
                  style={{ fontFamily: 'monospace', fontSize: '1rem' }}
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
              <div className="card" style={{ padding: '1.5rem', border: '2px solid var(--color-gold)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 700 }}>TICKET DE RETIRO FÍSICO</span>
                    <h2 style={{ margin: '0.2rem 0', color: 'var(--color-text-primary)' }}>Pedido {scannedTicket.orderNumber}</h2>
                  </div>
                  <span
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: scannedTicket.isConsumed ? 'var(--color-danger)' : 'var(--color-success)',
                      color: '#FFFFFF',
                    }}
                  >
                    {scannedTicket.isConsumed ? 'ENTREGADO / CONSUMIDO' : 'DISPONIBLE PARA ENTREGA'}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Socio:</strong> {scannedTicket.clientName} ({scannedTicket.clientDocumentMasked})
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Total Pagado:</strong> {formatCurrencyPen(scannedTicket.totalPen)}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    <strong>Emitido:</strong> {scannedTicket.issuedAtUtc || 'Reciente'}
                  </p>
                </div>

                <h3 style={{ color: 'var(--color-text-primary)', fontSize: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem' }}>
                  Suplementos a Entregar:
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 1.5rem 0' }}>
                  {(scannedTicket.items || []).map((it) => (
                    <li
                      key={it.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <span>
                        {it.quantity}x {it.productName} ({it.productBrand} - {it.productPresentation}{' '}
                        {it.productFlavor ? `· ${it.productFlavor}` : ''})
                      </span>
                      <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{formatCurrencyPen(it.lineTotalPen)}</span>
                    </li>
                  ))}
                </ul>

                {!scannedTicket.isConsumed ? (
                  <div style={{ background: 'var(--color-bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <label className="form-label" htmlFor="delivery-notes">
                      Notas de verificación física (opcional):
                    </label>
                    <input
                      id="delivery-notes"
                      type="text"
                      className="form-input"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Ej: DNI contrastado, socio retiró en persona"
                      style={{ marginBottom: '1rem' }}
                    />
                    <Button onClick={handleConfirmDelivery} disabled={actionLoading}>
                      {actionLoading ? 'Procesando entrega…' : '✓ Confirmar Entrega Física'}
                    </Button>
                  </div>
                ) : (
                  <Alert
                    variant="danger"
                    message={`Este ticket ya fue consumido el ${scannedTicket.consumedAtUtc}. No entregue productos nuevamente.`}
                  />
                )}
              </div>
            ) : (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <p style={{ margin: 0 }}>Escanee o ingrese un token QR en recepción para validar la orden del socio.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 440px' : '1fr', gap: '1.5rem' }}>
          <div>
            {loading ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Cargando pedidos…
              </div>
            ) : orders.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No hay pedidos en la bandeja seleccionada.
              </div>
            ) : (
              <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Socio</th>
                      <th>Total</th>
                      <th>Método</th>
                      <th>Estado Pedido</th>
                      <th>Estado Pago</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{ord.orderNumber}</td>
                        <td>
                          <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{ord.clientName}</div>
                          <small style={{ color: 'var(--color-text-muted)' }}>{ord.clientPhone || ord.clientDocumentMasked}</small>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrencyPen(ord.totalPen)}</td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{ord.paymentMethod}</td>
                        <td>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background:
                                ord.orderStatus === 'ENTREGADO'
                                  ? '#065F46'
                                  : ord.orderStatus === 'LISTO_PARA_RETIRO'
                                  ? '#1E40AF'
                                  : '#475569',
                              color: '#FFFFFF',
                            }}
                          >
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background:
                                ord.paymentStatus === 'VERIFICADO'
                                  ? '#065F46'
                                  : ord.paymentStatus === 'EVIDENCIA_SUBIDA'
                                  ? '#92400E'
                                  : '#475569',
                              color: '#FFFFFF',
                            }}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td>
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

          {selectedOrder && (
            <div className="card" style={{ padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '0.5rem',
                }}
              >
                <h2 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.15rem' }}>
                  Detalle {selectedOrder.orderNumber}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Cerrar detalle"
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <div style={{ color: 'var(--color-text-secondary)' }}>Cargando detalle…</div>
              ) : (
                <div>
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Socio:</strong> {selectedOrder.clientName}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Documento:</strong> {selectedOrder.clientDocumentMasked}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Teléfono:</strong> {selectedOrder.clientPhone || 'No registrado'}
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Total:</strong>{' '}
                      <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                        {formatCurrencyPen(selectedOrder.totalPen)}
                      </span>
                    </p>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Método:</strong> {selectedOrder.paymentMethod}
                    </p>

                    {selectedOrder.paymentMethod === 'TARJETA_PASARELA' && (
                      <div
                        role="status"
                        style={{
                          margin: '0.7rem 0',
                          padding: '0.9rem',
                          border: '1px solid var(--color-gold)',
                          borderRadius: '8px',
                          background: 'rgba(212,175,55,0.1)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        <strong>Cobro digital CulqiLink</strong>
                        <p style={{ margin: '0.4rem 0' }}>Estado del enlace: {digitalLink?.status || 'sin enlace disponible'}</p>
                        {digitalLink?.expiresAt && (
                          <p style={{ margin: '0.4rem 0' }}>
                            Vence: {new Date(digitalLink.expiresAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
                          </p>
                        )}
                        <p style={{ margin: '0.4rem 0 0.6rem' }}>
                          {selectedOrder.paymentStatus === 'VERIFICADO'
                            ? 'Cargo confirmado por Culqi. Continúe con la preparación y entrega del pedido.'
                            : digitalLink?.status === 'REVIEW'
                            ? 'Se detectó un cargo tardío o inconsistente: requiere revisión.'
                            : digitalLink?.status === 'EXPIRED'
                            ? 'El enlace venció sin pago verificado.'
                            : 'Esperando conciliación automática con Culqi.'}
                        </p>
                        <Button variant="secondary" onClick={() => handleSelectOrder(selectedOrder.id)} disabled={detailLoading}>
                          Actualizar estado Culqi
                        </Button>
                      </div>
                    )}

                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Referencia de Pago:</strong> {selectedOrder.paymentReference || 'Pendiente'}
                    </p>
                    {selectedOrder.paymentEvidenceUrl && (
                      <p style={{ margin: '0.4rem 0' }}>
                        <a
                          href={selectedOrder.paymentEvidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-gold)', textDecoration: 'underline', fontWeight: 600 }}
                        >
                          Ver Comprobante Adjunto ↗
                        </a>
                      </p>
                    )}
                  </div>

                  <h4 style={{ color: 'var(--color-text-primary)', margin: '0.75rem 0 0.5rem 0', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    Productos Solicitados:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', fontSize: '0.85rem' }}>
                    {(selectedOrder.items || []).map((it) => (
                      <li
                        key={it.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {it.quantity}x {it.productName} ({it.productPresentation})
                        </span>
                        <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{formatCurrencyPen(it.lineTotalPen)}</span>
                      </li>
                    ))}
                  </ul>

                  {((selectedOrder.orderStatus === 'PENDIENTE_PAGO' &&
                    selectedOrder.paymentMethod === 'EFECTIVO_MOSTRADOR' &&
                    (isExecutive || isRecepcion())) ||
                    (selectedOrder.orderStatus === 'PAGADO_POR_VERIFICAR' && isExecutive)) && (
                    <div
                      style={{
                        background: 'var(--color-bg-elevated)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        marginBottom: '1rem',
                      }}
                    >
                      <h4 style={{ color: 'var(--color-gold)', margin: '0 0 0.5rem 0' }}>
                        {selectedOrder.paymentMethod === 'EFECTIVO_MOSTRADOR' ? 'Registrar cobro en efectivo' : 'Validación de comprobante'}
                      </h4>
                      <form onSubmit={handleApprovePayment}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label className="form-label" htmlFor="approve-amount">
                            Monto Verificado en Caja (S/):
                          </label>
                          <input
                            id="approve-amount"
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={approveAmount}
                            onChange={(e) => setApproveAmount(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label className="form-label" htmlFor="approve-notes">
                            Notas:
                          </label>
                          <input
                            id="approve-notes"
                            type="text"
                            className="form-input"
                            value={approveNotes}
                            onChange={(e) => setApproveNotes(e.target.value)}
                            placeholder="Ej: Confirmado en cuenta BCP"
                          />
                        </div>
                        <Button type="submit" disabled={actionLoading}>
                          {selectedOrder.paymentMethod === 'EFECTIVO_MOSTRADOR' ? 'Confirmar efectivo recibido' : 'Aprobar pago'}
                        </Button>
                      </form>

                      {isExecutive && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Motivo de rechazo"
                            style={{ marginBottom: '0.5rem' }}
                          />
                          <Button variant="danger" onClick={handleRejectPayment} disabled={actionLoading || !rejectReason.trim()}>
                            Rechazar Pago
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedOrder.orderStatus === 'CONFIRMADO_PREPARACION' && (
                    <div style={{ background: 'var(--color-bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
                        El pago está verificado. Una vez empaquetados los productos, marque el pedido como listo para generar el ticket QR del socio.
                      </p>
                      <Button onClick={handleMarkReady} disabled={actionLoading}>
                        Empaquetado Listo para Retiro
                      </Button>
                    </div>
                  )}

                  {selectedOrder.hasPickupToken && (
                    <div
                      style={{
                        background: 'var(--color-success-bg)',
                        border: '1px solid var(--color-success-border)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        color: 'var(--color-success)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
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
