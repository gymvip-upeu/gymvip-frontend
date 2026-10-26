import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listCoverage } from '../api/jorgeApi';
import { httpClient } from '../api/httpClient';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { stateLabel, dateLabel } from '../components/common/CoverageCard';
import ClientManageModal from '../components/modals/ClientManageModal';

export default function CoveragePage() {
  const { token, user } = useAuth();
  const storageKey = `gymvip-coverage-${user.email}`;
  const [saved] = useState(() => {
    const defaults = { query: '', state: 'ALERTAS', planId: '', from: '', to: '' };
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey));
      if (value && Object.keys(defaults).every(key => typeof value.filters?.[key] === 'string')) return value;
    } catch {}
    return { filters: defaults, page: 0 };
  });
  const [filters, setFilters] = useState(saved.filters);
  const [applied, setApplied] = useState(saved.filters);
  const [page, setPage] = useState(Number.isInteger(saved.page) && saved.page >= 0 ? saved.page : 0);
  const [result, setResult] = useState(null); const [plans, setPlans] = useState([]);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); const [revision, setRevision] = useState(0);
  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify({ filters: applied, page })); } catch {} }, [applied, page, storageKey]);
  useEffect(() => {
    let active = true;
    httpClient('/api/v1/plans', {}, token).then(async r => { if (!r.ok) throw new Error('No se pudieron cargar los planes.'); return r.json(); })
      .then(value => active && setPlans(value)).catch(e => active && setError(e.message));
    return () => { active = false; };
  }, [token]);
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setResult(null);
    listCoverage({ ...applied, page, size: 20 }, token).then(value => {
      if (!active) return;
      if (page > 0 && page >= value.totalPages) { setPage(Math.max(value.totalPages - 1, 0)); return; }
      setResult(value);
    })
      .catch(e => active && setError(e.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [applied, page, token, revision]);
  useEffect(() => {
    const refresh = () => setRevision(n => n + 1);
    window.addEventListener('focus', refresh); window.addEventListener('gymvip-membership-changed', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('gymvip-membership-changed', refresh); };
  }, []);
  const change = e => setFilters(previous => ({ ...previous, [e.target.name]: e.target.value }));
  return <section><h1>Vigencias y vencimientos</h1><p>Consulta la cobertura pagada y prioriza las membresías que requieren atención.</p>
    <form className="card jorge-filters" onSubmit={e => { e.preventDefault(); setPage(0); setApplied({ ...filters }); }}>
      <label>Cliente o documento<input className="form-input" name="query" value={filters.query} onChange={change} /></label>
      <label>Estado<select aria-label="Estado" className="form-input" name="state" value={filters.state} onChange={change}>{['ALERTAS','TODOS','VIGENTE','POR_VENCER','VENCIDO','CANCELADA','PENDIENTE','SIN_MEMBRESIA'].map(s => <option key={s} value={s}>{s === 'ALERTAS' ? 'Próximas y vencidas' : s === 'TODOS' ? 'Todos' : stateLabel(s)}</option>)}</select></label>
      <label>Plan<select aria-label="Plan" className="form-input" name="planId" value={filters.planId} onChange={change}><option value="">Todos los planes</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Último día válido desde<input type="date" className="form-input" name="from" value={filters.from} onChange={change} /></label>
      <label>Hasta<input type="date" className="form-input" name="to" value={filters.to} min={filters.from} onChange={change} /></label>
      <Button type="submit">Aplicar filtros</Button><Button type="button" variant="secondary" onClick={() => setRevision(n => n + 1)}>Actualizar</Button>
    </form>{error && <Alert variant="danger" message={error} />}{loading && <p role="status">Consultando vigencias…</p>}
    {!loading && result && <><p>{result.totalElements} clientes · Ordenados por vencimiento, más urgentes primero.</p>
      {result.content.length === 0 ? <div className="card"><h3>Sin resultados</h3><p>No hay membresías que coincidan con estos filtros.</p></div> : <div className="card jorge-table"><table className="data-table">
        <thead><tr><th>Cliente</th><th>Plan</th><th>Inicio</th><th>Último día válido</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{result.content.map(row => <tr key={row.clientId}><td><strong>{row.fullName}</strong><br />{row.document}<br /><small>{row.memberCode}</small></td><td>{row.planName || '—'}</td><td>{dateLabel(row.startDate)}</td><td>{dateLabel(row.lastIncludedDate)}</td><td>{stateLabel(row.state)}</td><td><Button variant="secondary" onClick={() => setSelected({ id: row.clientId })}>Ver ficha</Button></td></tr>)}</tbody>
      </table></div>}<div className="jorge-toolbar"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(n => n - 1)}>Anterior</Button><span>Página {page + 1} de {Math.max(result.totalPages, 1)}</span><Button variant="secondary" disabled={result.last} onClick={() => setPage(n => n + 1)}>Siguiente</Button></div></>}
    {selected && <ClientManageModal client={selected} onClose={() => setSelected(null)} onUpdated={() => setRevision(n => n + 1)} />}
  </section>;
}
