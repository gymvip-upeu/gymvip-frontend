import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { listIncidentsApi, createIncidentApi, closeIncidentApi } from '../api/incidentsApi.js';
import { Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { operationalTheme } from './operationalTheme.js';

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
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    setLoading(true);
    listIncidentsApi(status, token).then(data => { if (active) setItems(data); })
      .catch(err => { if (active) { setError(err.message); setItems([]); } })
      .finally(() => { if (active) setLoading(false); });
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

  return <ThemeProvider theme={operationalTheme}>
    <Box component="section" sx={{ maxWidth: 1050, mx: 'auto', p: 2 }}>
      <Typography variant="overline" color="primary">CONTROL Y AUDITORÍA</Typography>
      <Typography variant="h4" component="h1" gutterBottom>Incidencias</Typography>
      <Typography color="text.secondary" mb={3}>Registra situaciones operativas y conserva el motivo y responsable del cierre.</Typography>
      <Paper component="form" onSubmit={create} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>Nueva incidencia</Typography>
        <Stack spacing={2}>
          <TextField label="Título" value={title} onChange={event => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 160 } }} required fullWidth />
          <TextField label="Descripción" value={description} onChange={event => setDescription(event.target.value)} slotProps={{ htmlInput: { maxLength: 2000 } }} required multiline minRows={3} fullWidth />
          <Button type="submit" disabled={busy} sx={{ alignSelf: 'flex-start' }}>Registrar incidencia</Button>
        </Stack>
      </Paper>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel id="incident-status-label">Estado</InputLabel><Select labelId="incident-status-label" label="Estado" value={status} onChange={event => setStatus(event.target.value)}><MenuItem value="ABIERTA">Abiertas</MenuItem><MenuItem value="CERRADA">Cerradas</MenuItem></Select></FormControl>
        <Button variant="outlined" onClick={() => setRevision(n => n + 1)}>Actualizar</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }} role="status"><CircularProgress size={20} /><Typography>Consultando incidencias…</Typography></Stack>}
      {!loading && !error && items.length === 0 && <Typography color="text.secondary">Sin incidencias para este estado.</Typography>}
      <Stack spacing={2}>{items.map(item => <Paper component="article" key={item.id} sx={{ p: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h6">{item.title}</Typography><Chip label={item.status} color={item.status === 'ABIERTA' ? 'warning' : 'success'} size="small" /></Stack>
        <Typography my={1}>{item.description}</Typography>
        <Typography variant="caption" color="text.secondary">Registrada por {item.reportedBy} · {limaTime(item.createdAtUtc)}</Typography>
        {item.status === 'ABIERTA' ? <Stack spacing={1} mt={2}>
          <TextField label="Motivo de cierre" value={reason[item.id] || ''} onChange={event => setReason(current => ({ ...current, [item.id]: event.target.value }))} slotProps={{ htmlInput: { maxLength: 1000 } }} multiline minRows={2} fullWidth />
          <Button disabled={busy || !reason[item.id]?.trim()} onClick={() => close(item.id)} sx={{ alignSelf: 'flex-start' }}>Cerrar con motivo</Button>
        </Stack> : <Typography mt={2} color="text.secondary">Cerrada por {item.closedBy} · {limaTime(item.closedAtUtc)}<br />Motivo: {item.closeReason}</Typography>}
      </Paper>)}</Stack>
    </Box>
  </ThemeProvider>;
}
