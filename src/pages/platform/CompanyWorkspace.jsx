import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { httpClient } from '../../api/httpClient';

function usePanel(path, token) {
  const [attempt, retry] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await httpClient(path, { signal: controller.signal }, token);
        if (!response.ok) throw new Error('No se pudo cargar esta sección.');
        const data = await response.json();
        if (!controller.signal.aborted) setResult({ path, data });
      } catch {
        if (!controller.signal.aborted) setResult({ path, error: true });
      }
    }
    load();
    return () => controller.abort();
  }, [path, token, attempt]);
  return { ...(result?.path === path ? result : {}), retry: () => retry(n => n + 1) };
}

function Panel({ title, result, children }) {
  return <Card variant="outlined"><CardContent>
    <Typography variant="h6" mb={2}>{title}</Typography>
    {result.error ? <Alert severity="error" action={<Button onClick={result.retry}>Reintentar</Button>}>No se pudo cargar esta sección.</Alert>
      : result.data == null ? <Typography role="status">Cargando…</Typography> : children(result.data)}
  </CardContent></Card>;
}

function Members({ scope, token }) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const result = usePanel('/api/v1/clients?' + new URLSearchParams({ ...scope, query: search, page, size: 20 }), token);
  return <Stack spacing={1}>
    <Stack component="form" direction="row" spacing={1} onSubmit={e => { e.preventDefault(); setSearch(input.trim()); setPage(0); }}>
      <TextField size="small" fullWidth label="Buscar miembro" value={input} onChange={e => setInput(e.target.value)} />
      <Button type="submit" variant="contained">Buscar</Button>
    </Stack>
    <Panel title="Directorio" result={result}>{data => <>
      {data.content.map(member => <Typography key={member.id}>{member.fullName} · {member.memberCode}</Typography>)}
      <Typography my={1}>{data.totalElements} resultados</Typography>
      <Button disabled={!page} onClick={() => setPage(page - 1)}>Anterior</Button>
      <Button disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
    </>}</Panel>
  </Stack>;
}

function Operations({ scope, token }) {
  const query = new URLSearchParams(scope);
  const metrics = usePanel('/api/v1/dashboard/metrics?' + query, token);
  const alerts = usePanel('/api/v1/coverage?state=ALERTAS&size=8&' + query, token);
  const methods = usePanel('/api/v1/memberships/payment-methods', token);
  const links = usePanel('/api/v1/memberships/payment-links/config', token);
  return <Stack spacing={2}>
    <Panel title="Indicadores de la empresa" result={metrics}>{m => <Typography>
      {m.totalClients} miembros · {m.todayAttendance} asistencias hoy · {m.pendingOrders} pedidos pendientes
    </Typography>}</Panel>
    <Members scope={scope} token={token} />
    <Panel title="Vigencias que requieren atención" result={alerts}>{a => a.content.length
      ? a.content.map(row => <Typography key={row.clientId}>{row.fullName ?? row.name ?? row.memberCode} · {row.state}</Typography>)
      : <Typography>Sin alertas en esta selección.</Typography>}</Panel>
    <Panel title="Métodos de cobro" result={methods}>{m => <Typography>{m.join(' · ')}</Typography>}</Panel>
    <Panel title="Enlaces de pago" result={links}>{l => <Typography>{l.culqiEnabled ? 'Habilitados' : 'Deshabilitados'}</Typography>}</Panel>
  </Stack>;
}

export default function CompanyWorkspace({ company, token, onExit }) {
  const [branch, setBranch] = useState('');
  const branches = usePanel('/api/v1/platform/organizations/' + company.organizationId + '/branches', token);
  const scope = { organizationId: company.organizationId, ...(branch ? { branchId: branch } : {}) };
  return <Stack spacing={3}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h5">{company.organizationName}</Typography>
      <Button onClick={onExit}>Volver a empresas</Button>
    </Stack>
    <Panel title="Sede" result={branches}>{rows => <TextField select fullWidth label="Sede operativa" value={branch} onChange={e => setBranch(e.target.value)}>
      <MenuItem value="">Todas las sedes</MenuItem>
      {rows.map(row => <MenuItem value={row.id} key={row.id}>{row.name}</MenuItem>)}
    </TextField>}</Panel>
    <Operations key={company.organizationId + branch} scope={scope} token={token} />
  </Stack>;
}
