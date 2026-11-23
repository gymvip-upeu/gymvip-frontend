import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { listIncidentsApi, createIncidentApi, closeIncidentApi } from '../api/incidentsApi.js';
import { Button } from '../components/common/Button.jsx';
import { Alert } from '../components/common/Alert.jsx';
import './IncidentsPage.css';

function limaTime(raw) {
  if (!raw) return '—';
  const parsed = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('es-PE', { timeZone: 'America/Lima' });
}

export default function IncidentsPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState('ABIERTA');
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    listIncidentsApi(status, token).then(data => { if (active) setItems(data); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [status, token, revision]);

  async function create(event) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setBusy(true); setError('');
    try {
      await createIncidentApi(title.trim(), description.trim(), token);
      setTitle(''); setDescription(''); setStatus('ABIERTA'); setRevision(n => n + 1);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function close(id) {
    const explanation = reason[id]?.trim();
    if (!explanation) { setError('Indica el motivo de cierre.'); return; }
    setBusy(true); setError('');
    try {
      await closeIncidentApi(id, explanation, token);
      setRevision(n => n + 1);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <section className="incidents-page">
    <header><span>CONTROL Y AUDITORÍA</span><h1>Incidencias</h1><p>Registra situaciones operativas y conserva el motivo y responsable del cierre.</p></header>
    <form className="incident-create" onSubmit={create}>
      <h2>Nueva incidencia</h2>
      <label>Título<input value={title} maxLength={160} onChange={event => setTitle(event.target.value)} required /></label>
      <label>Descripción<textarea value={description} maxLength={2000} onChange={event => setDescription(event.target.value)} required /></label>
      <Button type="submit" disabled={busy}>Registrar incidencia</Button>
    </form>
    <div className="incident-filter"><label>Estado <select value={status} onChange={event => setStatus(event.target.value)}><option value="ABIERTA">Abiertas</option><option value="CERRADA">Cerradas</option></select></label><Button variant="secondary" onClick={() => setRevision(n => n + 1)}>Actualizar</Button></div>
    {error && <Alert variant="danger" message={error} />}
    <div className="incident-list">{items.length === 0 && <p>Sin incidencias para este estado.</p>}{items.map(item => <article key={item.id}>
      <div className="incident-top"><h2>{item.title}</h2><strong>{item.status}</strong></div>
      <p>{item.description}</p><small>Registrada por {item.reportedBy} · {limaTime(item.createdAtUtc)}</small>
      {item.status === 'ABIERTA' ? <div className="incident-close"><label>Motivo de cierre<textarea value={reason[item.id] || ''} maxLength={1000} onChange={event => setReason(current => ({ ...current, [item.id]: event.target.value }))} /></label><Button disabled={busy || !reason[item.id]?.trim()} onClick={() => close(item.id)}>Cerrar con motivo</Button></div>
        : <p className="incident-closed">Cerrada por {item.closedBy} · {limaTime(item.closedAtUtc)}<br />Motivo: {item.closeReason}</p>}
    </article>)}</div>
  </section>;
}
