// ==============================================================================
// GYM VIP — Pantalla: MembershipsPage (Membresías, Cobros y Renovación HU-07, 08, 10)
// Diseño Luxury Fitness con Pasos Claros y Soporte de Idempotencia
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchClientsApi } from '../api/clientApi';
import { httpClient } from '../api/httpClient';
import {
  getMembershipHistory,
  getPaymentMethods,
  quoteMembership,
  sellMembership,
  pendingStorageKey,
  loadPending,
  persistPending,
  isDefinitiveRejection,
} from '../services/membershipService';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icons';
import MembershipCalendar from '../components/common/MembershipCalendar';
import { formatCurrencyPen } from '../utils/formatters';

const dateLabel = (value) => {
  if (!value) return '—';
  try {
    return new Date(`${value}T00:00:00Z`).toLocaleDateString('es-PE', { timeZone: 'UTC' });
  } catch {
    return value;
  }
};

const methodLabel = (value) =>
  ({
    EFECTIVO: 'Efectivo',
    YAPE: 'Yape',
    PLIN: 'Plin',
    TRANSFERENCIA: 'Transferencia Bancaria',
    POS: 'Tarjeta (POS Presencial)',
  }[value] || value);

export default function MembershipsPage() {
  const { token, user } = useAuth();
  const storageKey = pendingStorageKey(user?.email || 'default');
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [client, setClient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
  const [planId, setPlanId] = useState('');
  const [operation, setOperation] = useState('ENROLL');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [quote, setQuote] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [pending, setPending] = useState(() => {
    try {
      return loadPending(sessionStorage, storageKey);
    } catch {
      return null;
    }
  });
  const submitting = useRef(false);
  const searchSequence = useRef(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      getPaymentMethods(token),
      httpClient('/api/v1/plans?status=ACTIVO', {}, token).then(async (r) => {
        if (!r.ok) throw new Error('No se pudo cargar el catálogo de planes.');
        return r.json();
      }),
    ])
      .then(([available, catalog]) => {
        if (!active) return;
        setMethods(available);
        setMethod(available[0] || '');
        setPlans(catalog.filter((p) => p.durationDays === 30));
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    setHistory([]);
    if (!client) return;
    setHistoryLoading(true);
    getMembershipHistory(client.id, token)
      .then((rows) => active && setHistory(rows))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setHistoryLoading(false));

    return () => {
      active = false;
    };
  }, [client, token]);

  function invalidate() {
    setQuote(null);
    setAccepted(false);
    setReceipt(null);
  }

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setError('');
    setSearching(true);
    const sequence = ++searchSequence.current;
    try {
      const result = await searchClientsApi(query, 0, 20, token);
      if (sequence === searchSequence.current) {
        setClients(result.content);
        setSearched(true);
      }
    } catch (e) {
      if (sequence === searchSequence.current) setError(e.message);
    } finally {
      if (sequence === searchSequence.current) setSearching(false);
    }
  }

  async function preview(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    setQuote(null);
    setAccepted(false);
    setReceipt(null);
    try {
      setQuote(await quoteMembership({ clientId: client.id, planId, operation }, token));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    let attempt = pending;
    try {
      if (!attempt) {
        attempt = {
          key: crypto.randomUUID(),
          clientName: client.fullName,
          body: {
            clientId: client.id,
            planId,
            operation,
            quoteFingerprint: quote.fingerprint,
            amountPen: quote.pricePen,
            paymentMethod: method,
            reference: reference.trim() || null,
          },
        };
        persistPending(sessionStorage, storageKey, attempt);
        setPending(attempt);
      }
      const result = await sellMembership(attempt.body, attempt.key, token);
      sessionStorage.removeItem(storageKey);
      setPending(null);
      setReceipt(result);
      setQuote(null);
      setAccepted(false);
      window.dispatchEvent(new Event('gymvip-membership-changed'));
      const rows = await getMembershipHistory(result.clientId, token);
      if (!client || client.id === result.clientId) setHistory(rows);
    } catch (e) {
      if (isDefinitiveRejection(e.status)) {
        sessionStorage.removeItem(storageKey);
        setPending(null);
        setQuote(null);
        setAccepted(false);
      }
      setError(
        e.message +
          ((!e.status || e.status >= 500) && !receipt
            ? ' Si el resultado es incierto, reintente la misma operación.'
            : '')
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const handleCopyReceipt = () => {
    if (receipt?.receiptNumber) {
      navigator.clipboard.writeText(receipt.receiptNumber);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    }
  };

  const locked = busy || !!pending;

  return (
    <div className="memberships-page" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
          Membresías y Cobros Presenciales
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
          Contrate o renueve membresías mensuales de 30 días con cobro atómico presencial, constancia e idempotencia (HU-07, 08, 10).
        </p>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}

      {/* Operación Pendiente / Incierta de Red */}
      {pending && (
        <div
          className="card"
          role="status"
          style={{
            border: '2px solid var(--color-warning-border)',
            background: 'var(--color-warning-bg)',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-warning)', marginBottom: '8px' }}>
            <Icon name="alert-triangle" size={24} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Operación Pendiente de Confirmar</h2>
          </div>
          <p style={{ color: 'var(--color-text-primary)', margin: '6px 0' }}>
            Socio: <strong>{pending.clientName}</strong> · Importe: <strong>{formatCurrencyPen(pending.body.amountPen)}</strong> · Medio: <strong>{methodLabel(pending.body.paymentMethod)}</strong>
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '6px 0 16px 0' }}>
            Hubo una interrupción en la confirmación. Reintente para recuperar el resultado original de forma segura sin duplicar el cobro.
          </p>
          <Button variant="primary" disabled={busy} onClick={pay}>
            <Icon name="refresh" size={15} />
            <span>{busy ? 'Consultando transacción…' : 'Reintentar Misma Operación'}</span>
          </Button>
        </div>
      )}

      {/* Constancia de Recibo Emitido Exitosamente */}
      {receipt && (
        <section
          className="card"
          style={{
            border: '2px solid var(--color-gold)',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(21, 25, 34, 0.95) 100%)',
            padding: '28px',
            marginBottom: '28px',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}
          aria-live="polite"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '8px' }}>TRANSACCIÓN CONFIRMADA</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: 'var(--color-text-primary)' }}>
                Pago Presencial Registrado
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-gold)', fontWeight: 700 }}>
                  Constancia Interna: {receipt.receiptNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px', minHeight: '26px' }}
                  title="Copiar código de constancia"
                >
                  <Icon name="copy" size={12} />
                  <span>{copiedReceipt ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-gold)' }}>
                {formatCurrencyPen(receipt.amountPen)} {receipt.currency}
              </span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Medio: {methodLabel(receipt.paymentMethod)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'var(--color-surface-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', margin: '16px 0' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Plan Adquirido</span>
              <strong style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: '14px' }}>{receipt.planName}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Periodo Cubierto</span>
              <span style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: '13px' }}>
                Del {dateLabel(receipt.startDate)} al {dateLabel(receipt.lastIncludedDate)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Operador de Caja</span>
              <span style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: '13px' }}>{receipt.registeredBy}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Fecha y Hora</span>
              <span style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: '13px' }}>
                {new Date(`${receipt.paidAtUtc}Z`).toLocaleTimeString('es-PE', { timeZone: 'America/Lima' })} (Lima)
              </span>
            </div>
          </div>

          {receipt.policy && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '8px 0 0 0' }}>
              {receipt.policy}
            </p>
          )}
          <small style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Esta constancia interna acredita la activación en el sistema central y no constituye comprobante de pago tributario.
          </small>
        </section>
      )}

      {loading ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-gold)', fontWeight: 600 }}>Cargando catálogo tarifario y medios de cobro…</p>
        </div>
      ) : (
        <>
          {/* Paso 1: Búsqueda y Selección de Socio */}
          <section className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', background: 'var(--color-gold)', color: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                1
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Identificar al Socio</h2>
            </div>

            <form onSubmit={search} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '240px' }} className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <Icon name="search" size={16} color="var(--color-text-muted)" />
                </span>
                <input
                  id="member-search"
                  className="form-input with-left-icon"
                  value={query}
                  disabled={locked}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, documento o código MAR-XXXXXX..."
                />
              </div>
              <Button type="submit" variant="primary" disabled={locked || searching || !query.trim()}>
                <Icon name="search" size={15} />
                <span>{searching ? 'Buscando…' : 'Buscar Socio'}</span>
              </Button>
            </form>

            {/* Resultados de Clientes */}
            {clients.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
                  Seleccione el socio para la transacción:
                </span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {clients.map((c) => (
                    <Button
                      key={c.id}
                      variant={client?.id === c.id ? 'primary' : 'secondary'}
                      disabled={locked}
                      onClick={() => {
                        setClient(c);
                        invalidate();
                        setError('');
                      }}
                      style={{ fontSize: '13px', minHeight: '38px' }}
                    >
                      <Icon name="user" size={14} />
                      <span>{c.fullName} · {c.memberCode}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {searched && !clients.length && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '14px' }}>
                No se encontraron socios con el término ingresado. Verifique el nombre o DNI.
              </p>
            )}

            {client && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Socio Seleccionado</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {client.fullName} · <span style={{ color: 'var(--color-gold)' }}>{client.memberCode}</span>
                  </div>
                </div>
                <Badge variant="gold">Listo para Cotizar</Badge>
              </div>
            )}
          </section>

          {/* Paso 2: Configuración y Cotización del Plan */}
          {client && (
            <section className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', background: 'var(--color-gold)', color: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                  2
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Cotizar Membresía</h2>
              </div>

              <form onSubmit={preview}>
                <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                  <div>
                    <label className="form-label">Tipo de Operación</label>
                    <select
                      className="form-select"
                      value={operation}
                      onChange={(e) => {
                        setOperation(e.target.value);
                        invalidate();
                      }}
                    >
                      <option value="ENROLL">Primera Contratación / Alta</option>
                      <option value="RENEW">Renovación de Membresía</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Plan Activo (Mensual 30 Días)</label>
                    <select
                      className="form-select"
                      required
                      value={planId}
                      onChange={(e) => {
                        setPlanId(e.target.value);
                        invalidate();
                      }}
                    >
                      <option value="">Seleccione un plan del tarifario</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {formatCurrencyPen(p.pricePen)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Button type="submit" variant="primary" disabled={!planId || locked} style={{ width: '100%', minHeight: '44px' }}>
                      <Icon name="calendar" size={15} />
                      <span>{busy ? 'Calculando…' : 'Consultar Fechas e Importe'}</span>
                    </Button>
                  </div>
                </fieldset>
              </form>

              {!plans.length && (
                <p style={{ color: 'var(--color-warning)', fontSize: '13px', marginTop: '12px' }}>
                  No hay planes activos de 30 días configurados en el sistema.
                </p>
              )}

              {/* Resumen de Cotización y Paso 3 de Cobro */}
              {quote && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <div>
                      <span className="badge badge-gold" style={{ marginBottom: '6px' }}>COTIZACIÓN CALCULADA</span>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                        {quote.planName}
                      </h3>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-gold)' }}>
                      {formatCurrencyPen(quote.pricePen)}
                    </span>
                  </div>

                  {quote.currentEndExclusive && (
                    <p style={{ fontSize: '13px', color: 'var(--color-warning)', margin: '4px 0' }}>
                      ℹ️ La membresía actual finaliza antes del <strong>{dateLabel(quote.currentEndExclusive)}</strong>. La renovación extenderá la vigencia a partir de esa fecha.
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', margin: '14px 0', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', display: 'block' }}>Inicio de Cobertura</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{dateLabel(quote.startDate)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', display: 'block' }}>Último Día Válido</span>
                      <strong style={{ color: 'var(--color-gold)' }}>{dateLabel(quote.lastIncludedDate)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', display: 'block' }}>Límite Exclusivo</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{dateLabel(quote.endExclusive)} (Hora Lima)</span>
                    </div>
                  </div>

                  {/* Calendario de Cobertura */}
                  <div style={{ margin: '18px 0' }}>
                    <MembershipCalendar start={quote.startDate} last={quote.lastIncludedDate} />
                  </div>

                  {quote.benefits && (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '8px 0' }}>
                      <strong>Beneficios:</strong> {quote.benefits}
                    </p>
                  )}

                  {/* Paso 3: Confirmación y Registro del Cobro Presencial */}
                  <div style={{ marginTop: '24px', padding: '24px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-full)', background: 'var(--color-gold)', color: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                        3
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Confirmar Cobro Presencial</h3>
                    </div>

                    <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label className="form-label">Medio de Cobro</label>
                          <select
                            className="form-select"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                          >
                            {methods.map((m) => (
                              <option value={m} key={m}>
                                {methodLabel(m)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label">
                            N° Referencia {method !== 'EFECTIVO' ? '(Obligatorio para digital)' : '(Opcional)'}
                          </label>
                          <input
                            className="form-input"
                            value={reference}
                            maxLength={100}
                            placeholder={method === 'EFECTIVO' ? 'Opcional' : 'Ej. OP-98472912'}
                            onChange={(e) => setReference(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '18px' }}>
                        <label className="form-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            style={{ marginTop: '3px' }}
                          />
                          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                            Confirmo que he recibido el importe completo en caja (<strong>{formatCurrencyPen(quote.pricePen)}</strong>) y notifiqué las condiciones de servicio al socio.
                          </span>
                        </label>
                      </div>

                      <Button
                        variant="primary"
                        onClick={pay}
                        disabled={
                          locked ||
                          !accepted ||
                          !method ||
                          (method !== 'EFECTIVO' && !reference.trim())
                        }
                        style={{ width: '100%', minHeight: '46px', fontSize: '15px' }}
                      >
                        <Icon name="check-circle" size={16} />
                        <span>{busy ? 'Registrando transacción en caja…' : `Confirmar y Emitir Cobro de ${formatCurrencyPen(quote.pricePen)}`}</span>
                      </Button>
                    </fieldset>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Historial de Cobros y Periodos del Socio */}
      {(client || receipt) && (
        <section className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px 0' }}>
            Historial de Membresías y Cobros
          </h2>

          {historyLoading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Cargando historial de pagos…</p>
          ) : !history.length ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No hay cobros de membresía registrados para este cliente.
            </p>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Inicio</th>
                    <th>Último Día</th>
                    <th>Importe</th>
                    <th>Medio / Referencia</th>
                    <th>Constancia / Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.periodId}>
                      <td><strong>{row.planName}</strong></td>
                      <td>{dateLabel(row.startDate)}</td>
                      <td><strong style={{ color: 'var(--color-gold)' }}>{dateLabel(row.lastIncludedDate)}</strong></td>
                      <td><strong>{formatCurrencyPen(row.amountPen)}</strong></td>
                      <td>
                        <div>{methodLabel(row.paymentMethod)}</div>
                        <small style={{ color: 'var(--color-text-muted)' }}>{row.reference || '—'}</small>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-gold)' }}>
                          {row.receiptNumber}
                        </div>
                        <small style={{ color: 'var(--color-text-muted)' }}>{row.registeredBy}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
