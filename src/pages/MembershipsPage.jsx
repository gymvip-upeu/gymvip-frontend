import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchClientsApi } from '../api/clientApi';
import { httpClient } from '../api/httpClient';
import { getMembershipHistory, getPaymentMethods, quoteMembership, sellMembership,
  pendingStorageKey, loadPending, persistPending, isDefinitiveRejection } from '../services/membershipService';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import MembershipCalendar from '../components/common/MembershipCalendar';
import { formatCurrencyPen } from '../utils/formatters';

const dateLabel = value => new Date(`${value}T00:00:00Z`).toLocaleDateString('es-PE', { timeZone: 'UTC' });
const methodLabel = value => ({ EFECTIVO: 'Efectivo', YAPE: 'Yape', PLIN: 'Plin', TRANSFERENCIA: 'Transferencia', POS: 'POS presencial' }[value] || value);

export default function MembershipsPage() {
  const { token, user } = useAuth();
  const storageKey = pendingStorageKey(user.email);
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
  const [pending, setPending] = useState(() => {
    try { return loadPending(sessionStorage, storageKey); } catch { return null; }
  });
  const submitting = useRef(false);
  const searchSequence = useRef(0);

  useEffect(() => {
    let active = true;
    Promise.all([getPaymentMethods(token), httpClient('/api/v1/plans?status=ACTIVO', {}, token).then(async r => {
      if (!r.ok) throw new Error('No se pudo cargar el catálogo.');
      return r.json();
    })]).then(([available, catalog]) => {
      if (!active) return;
      setMethods(available); setMethod(available[0] || '');
      setPlans(catalog.filter(p => p.durationDays === 30));
    }).catch(e => active && setError(e.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    let active = true;
    setHistory([]);
    if (!client) return;
    setHistoryLoading(true);
    getMembershipHistory(client.id, token).then(rows => active && setHistory(rows))
      .catch(e => active && setError(e.message)).finally(() => active && setHistoryLoading(false));
    return () => { active = false; };
  }, [client, token]);

  function invalidate() { setQuote(null); setAccepted(false); setReceipt(null); }
  async function search(e) {
    e.preventDefault(); setError(''); setSearching(true);
    const sequence = ++searchSequence.current;
    try {
      const result = await searchClientsApi(query, 0, 20, token);
      if (sequence === searchSequence.current) { setClients(result.content); setSearched(true); }
    } catch (e) { if (sequence === searchSequence.current) setError(e.message); }
    finally { if (sequence === searchSequence.current) setSearching(false); }
  }
  async function preview(e) {
    e.preventDefault(); setError(''); setBusy(true); setQuote(null); setAccepted(false); setReceipt(null);
    try { setQuote(await quoteMembership({ clientId: client.id, planId, operation }, token)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function pay() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    let attempt = pending;
    try {
      if (!attempt) {
        attempt = { key: crypto.randomUUID(), clientName: client.fullName,
          body: { clientId: client.id, planId, operation, quoteFingerprint: quote.fingerprint,
            amountPen: quote.pricePen, paymentMethod: method, reference: reference.trim() || null } };
        // Persist before sending: an uncertain result must reuse the exact key and payload.
        persistPending(sessionStorage, storageKey, attempt);
        setPending(attempt);
      }
      const result = await sellMembership(attempt.body, attempt.key, token);
      sessionStorage.removeItem(storageKey); setPending(null); setReceipt(result); setQuote(null); setAccepted(false);
      window.dispatchEvent(new Event('gymvip-membership-changed'));
      const rows = await getMembershipHistory(result.clientId, token);
      if (!client || client.id === result.clientId) setHistory(rows);
    } catch (e) {
      // Keep authorization/resource failures unresolved: access may have changed after a prior commit.
      if (isDefinitiveRejection(e.status)) {
        sessionStorage.removeItem(storageKey); setPending(null); setQuote(null); setAccepted(false);
      }
      setError(e.message + ((!e.status || e.status >= 500) && !receipt ? ' Si el resultado es incierto, reintente la misma operación.' : ''));
    } finally { submitting.current = false; setBusy(false); }
  }
  const locked = busy || !!pending;
  return <div className="memberships-page">
    <h1>Membresías y cobros</h1>
    <p className="membership-muted">Contrata o renueva 30 días y registra el pago presencial en una sola confirmación.</p>
    {error && <Alert variant="danger" message={error} />}
    {pending && <div className="card" role="status">
      <h2>Operación pendiente de confirmar</h2>
      <p>{pending.clientName} · {formatCurrencyPen(pending.body.amountPen)} · {methodLabel(pending.body.paymentMethod)}</p>
      <p>Reintente para recuperar el resultado sin duplicar el cobro. No registre otra venta hasta resolver esta operación.</p>
      <Button disabled={busy} onClick={pay}>{busy ? 'Consultando…' : 'Reintentar la misma operación'}</Button>
    </div>}
    {receipt && <section className="card membership-receipt" aria-live="polite">
      <h2>Pago registrado</h2><p><strong>Constancia interna · {receipt.receiptNumber}</strong></p>
      <p>Plan: {receipt.planName} · {formatCurrencyPen(receipt.amountPen)} {receipt.currency}</p>
      <p>Inicio: {dateLabel(receipt.startDate)} · Último día incluido: {dateLabel(receipt.lastIncludedDate)}</p>
      <p>{methodLabel(receipt.paymentMethod)}{receipt.reference ? ` · Referencia: ${receipt.reference}` : ''}</p>
      <p>Registrado por {receipt.registeredBy} · {new Date(`${receipt.paidAtUtc}Z`).toLocaleString('es-PE', { timeZone: 'America/Lima' })} (Lima)</p>
      {receipt.policy && <p className="membership-muted">{receipt.policy}</p>}
      <p className="membership-muted">Esta constancia no es un comprobante tributario.</p>
    </section>}
    {loading ? <p role="status">Cargando planes y medios de pago…</p> : <>
      <section className="card">
        <h2>1. Selecciona al cliente</h2>
        <form onSubmit={search} className="membership-search">
          <label htmlFor="member-search">Nombre, documento o código de socio
            <input id="member-search" value={query} disabled={locked} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente existente" />
          </label><Button type="submit" disabled={locked || searching}>{searching ? 'Buscando…' : 'Buscar'}</Button>
        </form>
        <div className="membership-results">
          {clients.map(c => <Button key={c.id} variant={client?.id === c.id ? 'primary' : 'secondary'} disabled={locked}
            onClick={() => { setClient(c); invalidate(); setError(''); }}>{c.fullName} · {c.memberCode}</Button>)}
        </div>
        {searched && !clients.length && <p role="status">No se encontraron clientes. Revisa el nombre, documento o código.</p>}
        {client && <p aria-live="polite">Cliente seleccionado: <strong>{client.fullName}</strong> · {client.memberCode}</p>}
      </section>
      {client && <section className="card">
        <h2>2. Revisa la contratación</h2>
        <form onSubmit={preview} className="membership-form">
          <fieldset disabled={locked}>
            <label>Operación<select value={operation} onChange={e => { setOperation(e.target.value); invalidate(); }}>
              <option value="ENROLL">Primera contratación</option><option value="RENEW">Renovación</option>
            </select></label>
            <label>Plan activo de 30 días<select required value={planId} onChange={e => { setPlanId(e.target.value); invalidate(); }}>
              <option value="">Selecciona un plan</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} · {formatCurrencyPen(p.pricePen)}</option>)}
            </select></label>
            <Button type="submit" disabled={!planId || locked}>{busy ? 'Calculando…' : 'Consultar fechas e importe'}</Button>
          </fieldset>
        </form>
        {!plans.length && <p>No hay planes activos de 30 días. Solicita su configuración al administrador.</p>}
        {quote && <div className="membership-summary">
          <h3>{quote.planName} · {formatCurrencyPen(quote.pricePen)}</h3>
          {quote.currentEndExclusive && <p>La cobertura anterior termina antes del {dateLabel(quote.currentEndExclusive)}.</p>}
          <p><strong>Inicio: {dateLabel(quote.startDate)} · Último día incluido: {dateLabel(quote.lastIncludedDate)}</strong></p>
          <p className="membership-muted">Fin exclusivo: {dateLabel(quote.endExclusive)} · Hora de Lima</p>
          <MembershipCalendar start={quote.startDate} last={quote.lastIncludedDate} />
          {quote.benefits && <p>{quote.benefits}</p>}
          <p>{quote.policy}</p>
          <fieldset disabled={locked} className="membership-payment">
            <legend>3. Confirma el cobro completo</legend>
            <label>Medio de pago<select value={method} onChange={e => setMethod(e.target.value)}>
              {methods.map(m => <option value={m} key={m}>{methodLabel(m)}</option>)}
            </select></label>
            <label>Referencia {method !== 'EFECTIVO' ? '(obligatoria)' : '(opcional)'}
              <input value={reference} maxLength={100} onChange={e => setReference(e.target.value)} />
            </label>
            <label className="membership-checkbox"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
              Confirmo que recibí el importe completo y comuniqué las fechas y condiciones al cliente.</label>
            <Button onClick={pay} disabled={locked || !accepted || !method || (method !== 'EFECTIVO' && !reference.trim())}>
              {busy ? 'Registrando…' : `Confirmar cobro de ${formatCurrencyPen(quote.pricePen)}`}
            </Button>
          </fieldset>
        </div>}
      </section>}
    </>}
    {(client || receipt) && <section className="card">
      <h2>Historial de periodos y pagos</h2>
      {historyLoading ? <p role="status">Cargando historial…</p> : !history.length ? <p>No hay cobros de membresía registrados para este cliente.</p> :
        <div className="membership-table-wrap"><table><thead><tr><th>Plan</th><th>Inicio</th><th>Último día</th><th>Importe</th><th>Medio / referencia</th><th>Constancia / trabajador</th></tr></thead>
          <tbody>{history.map(row => <tr key={row.periodId}><td>{row.planName}</td><td>{dateLabel(row.startDate)}</td>
            <td>{dateLabel(row.lastIncludedDate)}</td><td>{formatCurrencyPen(row.amountPen)}</td>
            <td>{methodLabel(row.paymentMethod)}<br />{row.reference || '—'}</td><td>{row.receiptNumber}<br />{row.registeredBy}</td></tr>)}</tbody>
        </table></div>}
    </section>}
  </div>;
}
