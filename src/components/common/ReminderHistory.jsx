import React, { useEffect, useState } from 'react';
import { httpClient } from '../../api/httpClient';
import { formatAttemptDate } from '../../services/whatsappCommunications';

const labels = { APP: 'App móvil', WHATSAPP: 'WhatsApp', EMAIL: 'Correo electrónico',
  DISPONIBLE: 'Disponible en app · sin leer', LEIDO: 'Leído por el socio', SOLICITADO: 'Pendiente de envío',
  SIMULADO: 'Simulado · sin envío real', FALLIDO: 'Fallido', OMITIDO: 'Omitido',
  ENVIADO: 'Enviado', ENTREGADO: 'Entregado', ACEPTADO_PROVEEDOR: 'Aceptado por proveedor' };

export default function ReminderHistory({ token, version = 0 }) {
  const [rows, setRows] = useState([]);
  const [channel, setChannel] = useState('');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    (async () => {
      const response = await httpClient('/api/v1/reminders/communications', { signal: controller.signal }, token);
      if (!response.ok) throw new Error('No se pudo consultar el estado de los recordatorios.');
      const data = await response.json();
      if (!controller.signal.aborted) setRows(data);
    })().catch(() => { if (!controller.signal.aborted) setError('No se pudo consultar el estado de los recordatorios. Vuelve a actualizar.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, version, refresh]);
  const visible = rows.filter(row => (!channel || row.channel === channel) &&
    `${row.clientName} ${row.periodId} ${row.title}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <section className="reminders-card reminder-history" style={{ margin: '24px 0' }} aria-label="Seguimiento de recordatorios">
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <h2>Seguimiento de recordatorios por canal</h2>
      <button className="btn btn-secondary" type="button" disabled={loading} onClick={() => setRefresh(v => v + 1)}>
        {loading ? 'Consultando…' : 'Actualizar estados'}
      </button>
    </header>
    <p>La lectura corresponde al aviso dentro de la app. WhatsApp y correo tienen su propio resultado.</p>
    <div className="reminder-history-filters">
      <label>Canal <select aria-label="Filtrar canal" value={channel} onChange={e => setChannel(e.target.value)}>
        <option value="">Todos</option>{['APP', 'WHATSAPP', 'EMAIL'].map(c => <option key={c} value={c}>{labels[c]}</option>)}
      </select></label>
      <label>Buscar socio o periodo <input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="member-table-wrap"><table className="member-table">
      <thead><tr><th>Socio / periodo</th><th>Aviso</th><th>Canal</th><th>Resultado</th><th>Fecha / lectura</th></tr></thead>
      <tbody>{visible.map(row => <tr key={row.id}>
        <td><strong>{row.clientName}</strong><small>{row.periodId}</small></td>
        <td><strong>{row.title || row.ruleType}</strong><details><summary>Ver mensaje</summary><p>{row.message}</p></details></td>
        <td>{labels[row.channel] || row.channel}</td>
        <td><strong>{labels[row.status] || row.status}</strong>{row.errorMessage && <small>{row.errorMessage}</small>}</td>
        <td>{formatAttemptDate(row.createdAt)}{row.readAt && <small>Leído: {formatAttemptDate(row.readAt)}</small>}</td>
      </tr>)}{!loading && !visible.length && <tr><td colSpan={5}>Sin recordatorios para esta búsqueda.</td></tr>}</tbody>
    </table></div>
    <small>Últimos 500 registros. Actualiza después de que el socio lea su aviso.</small>
  </section>;
}
