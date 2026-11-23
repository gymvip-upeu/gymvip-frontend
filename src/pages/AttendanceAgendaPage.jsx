// ==============================================================================
// GYM VIP — Pantalla: AttendanceAgendaPage (Agenda y Calendario de Asistencias)
// Consulta administrativa, filtros combinados, auditoría de terminales y exportación CSV
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getAttendanceAgendaApi, exportAttendanceCsvApi } from '../api/attendanceApi.js';
import ReceptionTerminalModal from '../components/modals/ReceptionTerminalModal.jsx';
import OperationsNav from '../components/common/OperationsNav.jsx';
import { Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { operationalTheme } from './operationalTheme.js';

function formatLimaTime(utcString) {
  if (!utcString) return '-';
  try {
    const iso = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(utcString) ? utcString : `${utcString}Z`;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return utcString;
  }
}

function getTodayString() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export default function AttendanceAgendaPage({ onNavigate }) {
  const { token, user } = useAuth();

  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');
  const [method, setMethod] = useState('TODOS');
  const [status, setStatus] = useState('TODOS');
  const [page, setPage] = useState(0);

  const [agendaData, setAgendaData] = useState({
    items: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  });

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [terminalModalOpen, setTerminalModalOpen] = useState(false);

  const agendaAbortControllerRef = React.useRef(null);

  useEffect(() => {
    loadAgenda(0);
    return () => {
      if (agendaAbortControllerRef.current) {
        agendaAbortControllerRef.current.abort();
      }
    };
  }, [startDate, endDate, method, status, token]);

  async function loadAgenda(targetPage = 0) {
    if (agendaAbortControllerRef.current) {
      agendaAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    agendaAbortControllerRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const data = await getAttendanceAgendaApi(
        {
          startDate,
          endDate,
          query: searchQuery,
          method,
          status,
          page: targetPage,
          size: 20,
        },
        token,
        controller.signal
      );
      if (agendaAbortControllerRef.current === controller) {
        setAgendaData(data);
        setPage(targetPage);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (agendaAbortControllerRef.current === controller) setError(err.message || 'Error al consultar la agenda de asistencias.');
    } finally {
      if (agendaAbortControllerRef.current === controller) setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadAgenda(0);
  }

  async function handleExportCsv() {
    setExporting(true);
    setError('');
    try {
      const blob = await exportAttendanceCsvApi(
        {
          startDate,
          endDate,
          query: searchQuery,
          method,
          status,
        },
        token
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asistencias_gymvip_${startDate}_a_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Error al exportar el archivo CSV.');
    } finally {
      setExporting(false);
    }
  }

  // Métricas rápidas de los ítems en pantalla
  const items = agendaData.items || [];
  const totalRecorded = items.filter((i) => i.status === 'ATTENDANCE_RECORDED' || i.status === 'APROBADO').length;
  const qrInvertedCount = items.filter((i) => i.checkInMethod === 'QR_INVERTIDO').length;

  return <ThemeProvider theme={operationalTheme}>
    <Box component="section" sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <OperationsNav currentPath="/asistencias" onNavigate={onNavigate} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mt: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">Agenda y Control de Asistencias</Typography>
          <Typography color="text.secondary">Registro histórico, trazabilidad de accesos por terminal y flujo QR invertido.</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {user?.roles?.some(role => role.toUpperCase() === 'ADMIN') && <Button variant="outlined" onClick={handleExportCsv} disabled={exporting || loading}>{exporting ? 'Generando CSV…' : 'Exportar CSV'}</Button>}
          <Button onClick={() => setTerminalModalOpen(true)}>Terminal Mostrador (QR)</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        {[
          ['Registros en página', items.length, `${agendaData.totalElements} total en periodo`, 'text.primary'],
          ['Ingresos aprobados', totalRecorded, 'Asistencias efectivas', 'success.main'],
          ['Vía QR invertido', qrInvertedCount, 'Escaneados desde App Móvil', 'primary.main'],
        ].map(([label, value, detail, color]) => <Paper key={label} sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">{label}</Typography>
          <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{detail}</Typography>
        </Paper>)}
      </Box>

      <Paper component="form" onSubmit={handleSearchSubmit} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 2 }}>
          <TextField label="Desde" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ '& input': { colorScheme: 'dark' } }} fullWidth />
          <TextField label="Hasta" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ '& input': { colorScheme: 'dark' } }} fullWidth />
          <FormControl fullWidth><InputLabel id="attendance-method-label">Método de ingreso</InputLabel><Select labelId="attendance-method-label" label="Método de ingreso" value={method} onChange={event => setMethod(event.target.value)}>
            <MenuItem value="TODOS">Todos los métodos</MenuItem><MenuItem value="QR_INVERTIDO">QR invertido (app móvil)</MenuItem><MenuItem value="QR_SOCIO">QR de socio</MenuItem><MenuItem value="MANUAL_MOSTRADOR">Manual en mostrador</MenuItem>
          </Select></FormControl>
          <FormControl fullWidth><InputLabel id="attendance-status-label">Estado</InputLabel><Select labelId="attendance-status-label" label="Estado" value={status} onChange={event => setStatus(event.target.value)}>
            <MenuItem value="TODOS">Todos los estados</MenuItem><MenuItem value="ATTENDANCE_RECORDED">Ingreso aprobado</MenuItem><MenuItem value="ALREADY_REGISTERED">Ya asistió hoy</MenuItem><MenuItem value="COVERAGE_EXPIRED">Membresía vencida</MenuItem><MenuItem value="RECHAZADO">Rechazo general</MenuItem>
          </Select></FormControl>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField label="Buscar por nombre, DNI o código" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} fullWidth />
          <Button type="submit" disabled={loading}>Buscar</Button>
          <Button variant="outlined" type="button" onClick={() => { setStartDate(getTodayString()); setEndDate(getTodayString()); setSearchQuery(''); setMethod('TODOS'); setStatus('TODOS'); }}>Limpiar</Button>
        </Stack>
      </Paper>

      <Paper>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6">Registros encontrados</Typography>
          <Typography variant="body2" color="text.secondary">Página {agendaData.currentPage + 1} de {agendaData.totalPages || 1}</Typography>
        </Stack>
        {loading ? <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', p: 5 }} role="status"><CircularProgress size={20} /><Typography>Consultando agenda…</Typography></Stack>
          : items.length === 0 ? <Typography color="text.secondary" p={5} align="center">No se encontraron asistencias para los filtros seleccionados.</Typography>
          : <TableContainer><Table size="small" aria-label="Registros de asistencia"><TableHead><TableRow>
              {['Fecha', 'Hora (Lima)', 'Socio', 'DNI / Doc', 'Método', 'Terminal / Operador', 'Estado'].map(label => <TableCell key={label}>{label}</TableCell>)}
            </TableRow></TableHead><TableBody>{items.map(item => {
              const approved = item.status === 'ATTENDANCE_RECORDED' || item.status === 'APROBADO';
              const methodLabel = item.checkInMethod === 'QR_INVERTIDO' ? 'QR pantalla (móvil)' : item.checkInMethod === 'QR_SOCIO' ? 'QR socio' : item.checkInMethod === 'INTENTO_FALLIDO' ? 'Intento fallido' : 'Manual';
              return <TableRow key={item.id} hover>
                <TableCell>{item.attendanceDate}</TableCell><TableCell>{formatLimaTime(item.checkedAtUtc)}</TableCell>
                <TableCell><Typography fontWeight={700}>{item.memberName}</Typography><Typography variant="caption" color="primary">{item.memberCode}</Typography></TableCell>
                <TableCell>{item.documentNumber || '—'}</TableCell><TableCell><Chip size="small" color={item.checkInMethod === 'QR_INVERTIDO' ? 'warning' : 'default'} label={methodLabel} /></TableCell>
                <TableCell><Typography variant="body2">{item.terminalName || 'Recepción'}</Typography><Typography variant="caption" color="text.secondary">Op: {item.recordedBy || 'Sistema'}</Typography></TableCell>
                <TableCell><Chip size="small" color={approved ? 'success' : item.status === 'ALREADY_REGISTERED' ? 'warning' : 'error'} label={approved ? 'APROBADO' : item.status === 'ALREADY_REGISTERED' ? 'YA ASISTIÓ' : 'RECHAZADO'} /></TableCell>
              </TableRow>;
            })}</TableBody></Table></TableContainer>}
        {agendaData.totalPages > 1 && <Stack sx={{ alignItems: 'center', p: 2 }}><Pagination count={agendaData.totalPages} page={page + 1} onChange={(_, value) => loadAgenda(value - 1)} disabled={loading} color="primary" /></Stack>}
      </Paper>
      <ReceptionTerminalModal isOpen={terminalModalOpen} onClose={() => setTerminalModalOpen(false)} token={token} user={user} onNavigateAgenda={() => setTerminalModalOpen(false)} />
    </Box>
  </ThemeProvider>;
}
