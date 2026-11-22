import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { REPORT_METRICS, getReportApi, exportReportApi } from '../api/reportsApi.js';
import { Button } from '../components/common/Button.jsx';
import { Alert } from '../components/common/Alert.jsx';
import './ReportsPage.css';

function limaToday() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date());
  const p = Object.fromEntries(parts.map(item => [item.type, item.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

export default function ReportsPage() {
  const { token } = useAuth();
  const today = limaToday();
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [selected, setSelected] = useState(REPORT_METRICS.map(([key]) => key));
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (selected.length === 0) { setSnapshot(null); return; }
    let active = true;
    setLoading(true);
    setError('');
    getReportApi(from, to, selected, token)
      .then(result => { if (active) setSnapshot(result); })
      .catch(err => { if (active) { setError(err.message); setSnapshot(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [from, to, selected, token, revision]);

  function toggle(key) {
    setSelected(current => current.includes(key) ? current.filter(value => value !== key) : REPORT_METRICS.map(([value]) => value).filter(value => current.includes(value) || value === key));
  }

  async function download(format) {
    try {
      setError('');
      const blob = await exportReportApi(from, to, selected, format, token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reportes-gymvip-${from}-${to}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
  }

  const visible = REPORT_METRICS.filter(([key]) => selected.includes(key));
  const max = Math.max(1, ...visible.map(([key]) => Number(snapshot?.metrics?.[key] || 0)));

  return <section className="reports-page">
    <div className="reports-heading"><div><span>OPERACIÓN · ANÁLISIS</span><h1>Reportes</h1><p>Selecciona las métricas que se mostrarán y exportarán. Fechas en America/Lima.</p></div><Button variant="secondary" onClick={() => setRevision(n => n + 1)}>Actualizar</Button></div>
    <div className="reports-controls"><label>Desde<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label>Hasta<input type="date" value={to} onChange={event => setTo(event.target.value)} /></label></div>
    <fieldset className="reports-metrics"><legend>Métricas incluidas</legend>{REPORT_METRICS.map(([key, label]) => <label key={key}><input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} />{label}</label>)}</fieldset>
    <div className="reports-actions"><Button disabled={!selected.length || loading || !!error} onClick={() => download('xlsx')}>Exportar XLSX</Button><Button variant="secondary" disabled={!selected.length || loading || !!error} onClick={() => download('pdf')}>Exportar PDF</Button></div>
    {error && <Alert variant="danger" message={error} />}
    {loading && <p role="status">Calculando métricas…</p>}
    {!loading && snapshot && <>
      <div className="reports-chart" role="img" aria-label="Gráfica de las métricas seleccionadas">
        {visible.map(([key, label]) => <div className="reports-bar-row" key={key}><span>{label}</span><div className="reports-bar-track"><div style={{ width: `${Math.max(2, Number(snapshot.metrics[key] || 0) / max * 100)}%` }} /></div><strong>{snapshot.metrics[key] ?? 0}</strong></div>)}
      </div>
      {selected.includes('memberRegistrations') && <div className="reports-breakdown"><div><h2>Altas por día</h2>{Object.entries(snapshot.memberRegistrationsByDay || {}).map(([day, count]) => <p key={day}>{day}: {count}</p>)}</div><div><h2>Altas por mes</h2>{Object.entries(snapshot.memberRegistrationsByMonth || {}).map(([month, count]) => <p key={month}>{month}: {count}</p>)}</div></div>}
    </>}
  </section>;
}
