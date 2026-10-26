import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getClientByIdApi } from '../../api/clientApi';
import { updateClient, clientChanges, verifyCoverage } from '../../api/jorgeApi';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import CoverageCard from '../common/CoverageCard';

const labels = { firstName: 'Nombres', lastName: 'Apellidos', countryCode: 'País del documento', documentType: 'Tipo de documento', documentNumber: 'Número de documento', phone: 'Celular', email: 'Correo electrónico' };
function initialForm(client) {
  const doc = client.documents?.find(d => d.isPrimary) || client.documents?.[0] || {};
  return { firstName: client.firstName || '', lastName: client.lastName || '', countryCode: doc.countryCode || 'PE', documentType: doc.documentType || 'DNI', documentNumber: doc.documentNumber || '', phone: client.phone || '', email: client.email || '', version: client.version };
}
export default function ClientManageModal({ client, onClose, onUpdated }) {
  const { token, isAdmin } = useAuth();
  const [detail, setDetail] = useState(null); const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [coverage, setCoverage] = useState(null); const [coverageError, setCoverageError] = useState('');
  const [history, setHistory] = useState(null); const [historyError, setHistoryError] = useState('');
  const [historyPage, setHistoryPage] = useState(0); const [reload, setReload] = useState(0);
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement, root = dialog.current;
    root?.querySelector('button')?.focus();
    function keys(event) {
      if (event.key === 'Escape' && !busy && (!editing || window.confirm('¿Cerrar sin guardar los cambios?'))) onClose();
      if (event.key !== 'Tab') return;
      const controls = [...root.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    root?.addEventListener('keydown', keys);
    return () => { root?.removeEventListener('keydown', keys); previous?.focus(); };
  }, [busy, editing, onClose]);
  useEffect(() => {
    let active = true; setDetail(null); setError('');
    getClientByIdApi(client.id, token).then(value => { if (active) { setDetail(value); setForm(initialForm(value)); } }).catch(e => active && setError(e.message));
    return () => { active = false; };
  }, [client.id, token, reload]);
  useEffect(() => {
    let active = true; setCoverage(null); setCoverageError('');
    verifyCoverage(client.id, token).then(value => active && setCoverage(value)).catch(e => active && setCoverageError(e.message));
    return () => { active = false; };
  }, [client.id, token, reload]);
  useEffect(() => {
    if (!isAdmin()) return;
    let active = true; setHistory(null); setHistoryError('');
    clientChanges(client.id, historyPage, token).then(value => active && setHistory(value)).catch(e => active && setHistoryError(e.message));
    return () => { active = false; };
  }, [client.id, token, historyPage, reload]);
  async function save(e) {
    e.preventDefault(); if (busy) return; setBusy(true); setError(''); setSuccess('');
    try {
      const value = await updateClient(client.id, { ...form, email: form.email.trim() || null, phone: form.phone.trim() || null }, token);
      setDetail(value); setForm(initialForm(value)); setEditing(false); setSuccess('Datos actualizados correctamente.');
      setReload(n => n + 1); onUpdated?.(value);
    } catch (e) { setError(`${e.message}${e.details?.length ? ' ' + e.details.map(d => d.message).join(' ') : ''}`); }
    finally { setBusy(false); }
  }
  return <div ref={dialog} className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div className="modal-content jorge-modal">
    <div className="jorge-toolbar"><h2 id="detail-title">Ficha de socio</h2><Button variant="secondary" onClick={onClose} disabled={busy}>Cerrar</Button></div>
    {error && <Alert variant="danger" message={error} />}{success && <Alert variant="success" message={success} />}
    {!detail && !error && <p role="status">Cargando ficha…</p>}
    {!detail && error && <Button variant="secondary" onClick={() => setReload(n => n + 1)}>Reintentar</Button>}
    {detail && <><h3>{detail.fullName}</h3><p>{detail.memberCode} · Registro: {new Date(detail.createdAt).toLocaleDateString('es-PE')}</p>
      {editing ? <form onSubmit={save}><div className="jorge-grid">{Object.entries(labels).map(([name, label]) => <label key={name}>{label}{['email','phone'].includes(name) ? ' (opcional)' : ''}
        <input className="form-input" name={name} type={name === 'email' ? 'email' : 'text'} required={!['email','phone'].includes(name)} value={form[name]} disabled={busy}
          maxLength={['firstName','lastName'].includes(name) ? 100 : name === 'email' ? 150 : name === 'countryCode' ? 10 : name === 'documentType' ? 30 : name === 'phone' ? 20 : 50}
          onChange={e => setForm(previous => ({ ...previous, [name]: e.target.value }))} /></label>)}</div>
        <p>Si otra persona modificó la ficha, tus cambios se conservarán aquí para revisarlos.</p>
        <div className="jorge-toolbar"><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => { setForm(initialForm(detail)); setEditing(false); setError(''); }}>Cancelar edición</Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => { if (window.confirm('Recargar reemplazará lo escrito por la versión del servidor.')) { setEditing(false); setReload(n => n + 1); } }}>Recargar ficha</Button></div>
      </form> : <><dl className="jorge-details">{Object.entries(labels).map(([name, label]) => <div key={name}><dt>{label}</dt><dd>{initialForm(detail)[name] || '—'}</dd></div>)}</dl><Button onClick={() => { setEditing(true); setSuccess(''); }}>Editar datos</Button></>}
      <h3>Membresía y vigencia</h3>{coverageError ? <Alert variant="danger" message={`No se pudo verificar la membresía: ${coverageError}`} /> : coverage ? <CoverageCard value={coverage} /> : <p role="status">Consultando vigencia…</p>}
      {isAdmin() && <section><h3>Historial de cambios</h3>{historyError && <Alert variant="danger" message={historyError} />}{!history && !historyError && <p role="status">Cargando historial…</p>}
        {history && <><p>{history.totalElements ? `${history.totalElements} cambios de campos` : 'Todavía no hay cambios de datos registrados.'}</p>
          <div className="jorge-table"><table className="data-table"><thead><tr><th>Fecha (Lima)</th><th>Autor</th><th>Campo</th><th>Antes</th><th>Después</th></tr></thead><tbody>
            {history.content.map((row, i) => <tr key={`${row.changeId}-${i}`}><td>{new Date(`${row.changedAtUtc}Z`).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</td><td>{row.actor}</td><td>{labels[row.field] || row.field}</td><td>{row.before || '—'}</td><td>{row.after || '—'}</td></tr>)}
          </tbody></table></div><div className="jorge-toolbar"><Button variant="secondary" disabled={historyPage === 0} onClick={() => setHistoryPage(n => n - 1)}>Anterior</Button><span>Página {historyPage + 1}</span><Button variant="secondary" disabled={history.last} onClick={() => setHistoryPage(n => n + 1)}>Siguiente</Button></div></>}
      </section>}</>}
  </div></div>;
}
