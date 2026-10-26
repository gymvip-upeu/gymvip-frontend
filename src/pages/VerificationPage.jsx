import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchClientsApi } from '../api/clientApi';
import { verifyCoverage } from '../api/jorgeApi';
import CoverageCard from '../components/common/CoverageCard';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

export default function VerificationPage() {
  const { token } = useAuth(); const [query, setQuery] = useState(''); const [clients, setClients] = useState(null);
  const [page, setPage] = useState(0); const [searched, setSearched] = useState('');
  const [value, setValue] = useState(null); const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const sequence = useRef(0);
  useEffect(() => () => { sequence.current += 1; }, [token]);
  async function search(nextPage = 0, term = query) {
    const request = ++sequence.current; setBusy(true); setError(''); setValue(null); setSelected(null); setClients(null);
    try { const result = await searchClientsApi(term, nextPage, 20, token); if (request === sequence.current) { setClients(result); setPage(nextPage); setSearched(term); } }
    catch (e) { if (request === sequence.current) setError(e.message); } finally { if (request === sequence.current) setBusy(false); }
  }
  async function verify(client) {
    const request = ++sequence.current; setBusy(true); setValue(null); setError(''); setSelected(client);
    try { const result = await verifyCoverage(client.id, token); if (request === sequence.current) setValue(result); }
    catch (e) { if (request === sequence.current) setError(`No se puede confirmar el ingreso. ${e.message}`); } finally { if (request === sequence.current) setBusy(false); }
  }
  return <section><h1>Verificación manual</h1><p>Busca al socio y confirma su membresía antes de permitir el ingreso.</p>
    <form className="card jorge-toolbar" onSubmit={e => { e.preventDefault(); search(); }}><label className="jorge-grow">Nombre o documento<input className="form-input" value={query} onChange={e => { sequence.current += 1; setBusy(false); setQuery(e.target.value); setValue(null); setSelected(null); setClients(null); setError(''); }} required /></label><Button type="submit" disabled={busy}>Buscar socio</Button></form>
    {error && <Alert variant="danger" message={error} />}{busy && <p role="status">Consultando al servidor…</p>}
    {clients && <><h2>Selecciona la identidad correcta</h2>{!clients.content.length && <p>No se encontraron socios.</p>}
      <div className="jorge-grid">{clients.content.map(client => <article className="card" key={client.id}><strong>{client.firstName} {client.lastName}</strong><p>{client.documents?.map(d => `${d.documentType} ${d.documentNumber}`).join(' · ')}</p><p>{client.memberCode}</p><Button disabled={busy} onClick={() => verify(client)}>Verificar membresía</Button></article>)}</div>
      <div className="jorge-toolbar"><Button variant="secondary" disabled={busy || page === 0} onClick={() => search(page - 1, searched)}>Anterior</Button><span>Página {page + 1}</span><Button variant="secondary" disabled={busy || clients.last} onClick={() => search(page + 1, searched)}>Siguiente</Button></div></>}
    {value && <CoverageCard value={value} />}{selected && <Button variant="secondary" disabled={busy} onClick={() => verify(selected)}>Volver a verificar</Button>}
  </section>;
}
