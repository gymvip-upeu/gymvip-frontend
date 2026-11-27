import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import {
  approveCompanyRequestApi,
  listCompanyRequestsApi,
  reviewCompanyRequestApi,
  resendCompanyInvitationApi,
} from '../../api/saasPlatformApi';

const STATUS_OPTIONS = ['', 'RECIBIDA', 'EN_REVISION', 'OBSERVADA', 'APROBADA', 'INVITACION_ENVIADA', 'ACTIVADA', 'RECHAZADA', 'ARCHIVADA'];

function invitationFeedback(status) {
  if (status === 'PENDING') return 'Invitación en cola. Consulta el estado de la solicitud para comprobar el envío.';
  if (status === 'UNCONFIGURED') return 'Empresa aprobada. Falta configurar la URL de activación para enviar la invitación.';
  if (status === 'SIMULATED') return 'La invitación está en simulación. El proveedor no envió un correo.';
  if (status === 'FAILED') return 'El correo no pudo enviarse. Revisa Integraciones y vuelve a enviar la invitación.';
  if (status === 'ACCEPTED') return 'El proveedor aceptó la invitación.';
  return 'La solicitud ya fue procesada.';
}

export default function CompanyRequestsPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notesById, setNotesById] = useState({});

  const loadRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await listCompanyRequestsApi(token, statusFilter);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron consultar las solicitudes de afiliación.');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleReview = async (id, nextStatus) => {
    setError('');
    setNotice('');
    try {
      await reviewCompanyRequestApi(token, id, {
        status: nextStatus,
        notes: notesById[id] || `Actualizado a ${nextStatus}`,
      });
      setNotice(`Solicitud actualizada al estado ${nextStatus}.`);
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Error al actualizar estado.');
    }
  };

  const handleApproveAndProvision = async (id) => {
    setError('');
    setNotice('');
    try {
      const res = await approveCompanyRequestApi(token, id, true);
      setNotice(invitationFeedback(res.emailStatus));
      await loadRequests();
    } catch (err) {
      setError(err.message || 'No se pudo aprobar y aprovisionar la empresa.');
    }
  };

  const handleInvite = async (id) => {
    setError('');
    setNotice('');
    try {
      const res = await resendCompanyInvitationApi(token, id);
      setNotice(invitationFeedback(res.emailStatus));
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4">Solicitudes de Afiliación B2B</Typography>
          <Typography variant="body2" color="text.secondary">
            Bandeja oficial de gimnasios registrados desde la Landing Page Pública (flujo RECIBIDA → APROBADA).
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <TextField
            select
            size="small"
            label="Filtrar estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt || 'ALL'} value={opt}>{opt || 'Todos los estados'}</MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={loadRequests}>Refrescar</Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tracking</TableCell>
                <TableCell>Razón Social / Comercial</TableCell>
                <TableCell>RUC · Ubicación</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Observación</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell><Chip label={req.trackingCode} size="small" color="primary" variant="outlined" /></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{req.commercialName || req.businessName}</Typography>
                    <Typography variant="caption" color="text.secondary">{req.businessName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{req.ruc}</Typography>
                    <Typography variant="caption" color="text.secondary">{req.district}, {req.city} ({req.branchesCount} sedes)</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{req.contactName}</Typography>
                    <Typography variant="caption" color="text.secondary">{req.contactEmail}</Typography>
                  </TableCell>
                  <TableCell>{req.requestedPlanCode}</TableCell>
                  <TableCell>
                    <Chip
                      label={req.status}
                      size="small"
                      color={req.status === 'APROBADA' ? 'success' : req.status === 'RECHAZADA' ? 'error' : 'warning'}
                    />
                    {req.invitationStatus && req.status !== 'ACTIVADA' && (
                      <Typography variant="caption" display="block" color="text.secondary">{invitationFeedback(req.invitationStatus)}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Nota interna"
                      value={notesById[req.id] ?? req.reviewNotes ?? ''}
                      onChange={(e) => setNotesById((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      sx={{ minWidth: 160 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {!req.approvedOrganizationId && (
                        <>
                          <Button size="small" variant="outlined" onClick={() => handleReview(req.id, 'OBSERVADA')}>Observar</Button>
                          <Button size="small" variant="contained" onClick={() => handleApproveAndProvision(req.id)}>Aprobar y Crear</Button>
                          <Button size="small" color="error" onClick={() => handleReview(req.id, 'RECHAZADA')}>Rechazar</Button>
                        </>
                      )}
                      {req.status === 'APROBADA' && (
                        <Chip label={req.activationToken || 'Provisionada'} size="small" color="success" />
                      )}
                    </Stack>
                    {req.approvedOrganizationId && req.status !== 'ACTIVADA' && (
                      <Button size="small" onClick={() => handleInvite(req.id)}>Reenviar invitación</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!requests.length && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No hay solicitudes registradas con el filtro actual.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
