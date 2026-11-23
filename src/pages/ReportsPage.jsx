import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { REPORT_METRICS, getReportApi, exportReportApi } from '../api/reportsApi.js';
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, FormGroup, LinearProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { operationalTheme } from './operationalTheme.js';

function limaToday() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
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
    setSelected(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key]);
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

  return <ThemeProvider theme={operationalTheme}>
    <Box component="section" sx={{ maxWidth: 1120, mx: 'auto', p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
        <Box><Typography variant="overline" color="primary">OPERACIÓN · ANÁLISIS</Typography><Typography variant="h4" component="h1">Reportes</Typography><Typography color="text.secondary">Selecciona las métricas que se mostrarán y exportarán. Fechas en America/Lima.</Typography></Box>
        <Button variant="outlined" onClick={() => setRevision(n => n + 1)}>Actualizar</Button>
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <TextField label="Desde" type="date" value={from} onChange={event => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ '& input': { colorScheme: 'dark' } }} />
          <TextField label="Hasta" type="date" value={to} onChange={event => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ '& input': { colorScheme: 'dark' } }} />
        </Stack>
        <Typography variant="h6">Métricas incluidas</Typography>
        <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          {REPORT_METRICS.map(([key, label]) => <FormControlLabel key={key} control={<Checkbox checked={selected.includes(key)} onChange={() => toggle(key)} />} label={label} />)}
        </FormGroup>
      </Paper>
      <Stack direction="row" spacing={1} mb={2}>
        <Button disabled={!selected.length || loading || !!error} onClick={() => download('xlsx')}>Exportar XLSX</Button>
        <Button variant="outlined" disabled={!selected.length || loading || !!error} onClick={() => download('pdf')}>Exportar PDF</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }} role="status"><CircularProgress size={20} /><Typography>Calculando métricas…</Typography></Stack>}
      {!loading && snapshot && <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Resultados</Typography>
        <Stack spacing={2}>
          {visible.map(([key, label]) => <Box key={key} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 50px', sm: 'minmax(160px, 220px) 1fr 90px' }, gap: 1, alignItems: 'center' }}>
            <Typography>{label}</Typography><LinearProgress variant="determinate" value={Number(snapshot.metrics[key] || 0) / max * 100} sx={{ height: 14, borderRadius: 1 }} /><Typography align="right" fontWeight={700}>{snapshot.metrics[key] ?? 0}</Typography>
          </Box>)}
        </Stack>
        {selected.includes('memberRegistrations') && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mt={3}>
          <Box><Typography variant="h6">Altas por día</Typography>{Object.entries(snapshot.memberRegistrationsByDay || {}).map(([day, count]) => <Typography key={day}>{day}: {count}</Typography>)}</Box>
          <Box><Typography variant="h6">Altas por mes</Typography>{Object.entries(snapshot.memberRegistrationsByMonth || {}).map(([month, count]) => <Typography key={month}>{month}: {count}</Typography>)}</Box>
        </Stack>}
      </Paper>}
    </Box>
  </ThemeProvider>;
}
