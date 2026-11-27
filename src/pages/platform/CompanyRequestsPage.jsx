import { Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel } from '@mui/material';
import { recordCompanyVerificationApi } from '../../api/saasPlatformApi';
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
  if (status === 'UNCONFIGURED') return 'Empresa aprobada. Comprueba el canal de correo para enviar las instrucciones de primer acceso.';
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
  const [verification, setVerification] = useState(null);
  const [savingVerification, setSavingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const openVerification = (request) => {
    setVerificationError('');
    setVerification({
      id: request.id,
      ruc: request.ruc,
      fiscalStatus: request.fiscalStatus ?? 'OBSERVADO',
      fiscalCondition: request.fiscalCondition ?? 'OBSERVADO',
      verifiedBusinessName: request.verifiedBusinessName ?? '',
      representativeEvidence: request.representativeEvidence ?? '',
      contactConfirmed: Boolean(request.verifiedContactAt),
    });
  };

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

  const saveVerification = async (event) => {
    event.preventDefault();
    setSavingVerification(true);
    setVerificationError('');
    try {
      await recordCompanyVerificationApi(token, verification.id, {
        fiscalStatus: verification.fiscalStatus,
        fiscalCondition: verification.fiscalCondition,
        verifiedBusinessName: verification.verifiedBusinessName,
        representativeEvidence: verification.representativeEvidence,
        contactConfirmed: verification.contactConfirmed,
      });
      setVerification(null);
      await loadRequests();
    } catch (err) {
      setVerificationError(err.message);
    } finally {
      setSavingVerification(false);
    }
  };

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
                          <Button size="small" variant="outlined" onClick={() => openVerification(req)}>Verificación SUNAT</Button>
                          <Button size="small" variant="contained" onClick={() => handleApproveAndProvision(req.id)}
                            disabled={req.fiscalStatus !== 'ACTIVO' || req.fiscalCondition !== 'HABIDO' || !req.verifiedContactAt}>
                            Aprobar y crear
                          </Button>
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
      {verification && (
        <Dialog open onClose={() => !savingVerification && setVerification(null)} fullWidth maxWidth="sm">
          <form onSubmit={saveVerification}>
            <DialogTitle>Verificar solicitud de empresa</DialogTitle>
            <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
              {verificationError && <Alert severity="error">{verificationError}</Alert>}
              <Button href="https://www.gob.pe/institucion/sunat/pages/565-consultar-el-estado-del-ruc" target="_blank" rel="noreferrer">
                Consultar RUC {verification.ruc} en SUNAT
              </Button>
              <TextField select label="Estado del RUC" value={verification.fiscalStatus}
                onChange={(event) => setVerification({ ...verification, fiscalStatus: event.target.value })}>
                <MenuItem value="ACTIVO">Activo</MenuItem><MenuItem value="OBSERVADO">Observado</MenuItem>
              </TextField>
              <TextField select label="Condición del domicilio" value={verification.fiscalCondition}
                onChange={(event) => setVerification({ ...verification, fiscalCondition: event.target.value })}>
                <MenuItem value="HABIDO">Habido</MenuItem><MenuItem value="OBSERVADO">Observado</MenuItem>
              </TextField>
              <TextField required label="Razón social en SUNAT" value={verification.verifiedBusinessName}
                slotProps={{ htmlInput: { maxLength: 200 } }}
                onChange={(event) => setVerification({ ...verification, verifiedBusinessName: event.target.value })} />
              <TextField required label="Referencia de la evidencia de representación" value={verification.representativeEvidence}
                slotProps={{ htmlInput: { maxLength: 240 } }}
                onChange={(event) => setVerification({ ...verification, representativeEvidence: event.target.value })} />
              <FormControlLabel label="Confirmé el control del correo registrado"
                control={<Checkbox checked={verification.contactConfirmed} onChange={(event) =>
                  setVerification({ ...verification, contactConfirmed: event.target.checked })} />} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setVerification(null)} disabled={savingVerification}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={savingVerification}>Guardar revisión</Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
}
