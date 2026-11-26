import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
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
  calculateCommissionApi,
  listCommissionLedgerApi,
  listCommissionRulesApi,
  listLicensesApi,
  listSaasPlansApi,
  updateLedgerStatusApi,
  updateLicenseStatusApi,
} from '../../api/saasPlatformApi';

const LICENSE_STATES = ['TRIAL', 'ACTIVA', 'POR_VENCER', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA', 'DEMO'];

export default function LicensesCommissionsPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [rules, setRules] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [calcOrgId, setCalcOrgId] = useState('');
  const [calcOpType, setCalcOpType] = useState('MEMBERSHIP');
  const [calcAmount, setCalcAmount] = useState('120.00');
  const [calcPaymentStatus, setCalcPaymentStatus] = useState('PAID');

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [p, l, r, lg] = await Promise.all([
        listSaasPlansApi(token),
        listLicensesApi(token),
        listCommissionRulesApi(token),
        listCommissionLedgerApi(token),
      ]);
      setPlans(Array.isArray(p) ? p : []);
      const licList = Array.isArray(l) ? l : [];
      setLicenses(licList);
      if (!calcOrgId && licList.length) setCalcOrgId(licList[0].organizationId);
      setRules(Array.isArray(r) ? r : []);
      setLedger(Array.isArray(lg) ? lg : []);
    } catch (err) {
      setError(err.message || 'Error al cargar licencias y ledger de comisiones.');
    } finally {
      setLoading(false);
    }
  }, [token, calcOrgId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleChangeLicenseState = async (lic, nextStatus) => {
    setError('');
    setNotice('');
    try {
      await updateLicenseStatusApi(token, lic.organizationId, {
        planCode: lic.planCode,
        status: nextStatus,
        notes: `Cambio manual a ${nextStatus}`,
      });
      setNotice(`Licencia de ${lic.organizationName} actualizada a ${nextStatus}.`);
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado de la licencia.');
    }
  };

  const handleRecordSettledCommission = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      const opId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : '11111111-1111-4111-8111-111111111199';
      const created = await calculateCommissionApi(token, {
        organizationId: calcOrgId,
        operationType: calcOpType,
        sourceOperationId: opId,
        sourceReference: `LIQ-${Date.now()}`,
        paymentStatus: calcPaymentStatus,
        grossAmountPen: Number(calcAmount),
        notes: 'Cálculo transparente post-cobro confirmado',
      });
      setNotice(
        `Liquidación calculada: Bruto S/ ${created.grossAmountPen} | Pasarela S/ ${created.gatewayFeePen} | Comisión GYM VIP S/ ${created.platformCommissionPen} | Neto Gimnasio S/ ${created.gymNetAmountPen}`
      );
      await loadAll();
    } catch (err) {
      setError(err.message || 'El backend rechazó la liquidación.');
    }
  };

  const handleMarkLedger = async (id, nextStatus) => {
    setError('');
    try {
      await updateLedgerStatusApi(token, id, { status: nextStatus });
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado del ledger.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Licencias SaaS y Ledger de Comisiones</Typography>
          <Typography variant="body2" color="text.secondary">
            Solo las operaciones con pago liquidado (PAID/SETTLED) ingresan al ledger; sin split ficticio ni simulación de pagos.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={loadAll}>Actualizar</Button>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Grid container spacing={2.5} mb={3}>
        {plans.map((p) => (
          <Grid size={{ xs: 12, md: 4 }} key={p.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{p.name}</Typography>
                  <Chip label={p.code} color="primary" size="small" />
                </Stack>
                <Typography variant="h5" color="primary.main" sx={{ mt: 1 }}>
                  S/ {Number(p.monthlyFeePen).toFixed(2)} / mes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Hasta {p.maxBranches} sedes · {p.maxUsers} usuarios · Comisión {(Number(p.transactionCommissionPct) * 100).toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Ciclo de Vida de Licencias</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Estado actual</TableCell>
                <TableCell>Cambiar estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {licenses.map((lic) => (
                <TableRow key={lic.id}>
                  <TableCell>{lic.organizationName}</TableCell>
                  <TableCell>{lic.planCode}</TableCell>
                  <TableCell><Chip label={lic.status} size="small" /></TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={lic.status}
                      onChange={(e) => handleChangeLicenseState(lic, e.target.value)}
                      sx={{ minWidth: 160 }}
                    >
                      {LICENSE_STATES.map((st) => (
                        <MenuItem key={st} value={st}>{st}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Grid container spacing={2.5} mb={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Registrar Liquidación Post-Cobro</Typography>
              <Typography variant="caption" color="text.secondary">
                Si intentas liquidar un pago en estado PENDING, el backend lo rechazará (HTTP 400).
              </Typography>
              <Box component="form" onSubmit={handleRecordSettledCommission} sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Organización"
                    size="small"
                    value={calcOrgId}
                    onChange={(e) => setCalcOrgId(e.target.value)}
                    required
                  >
                    {licenses.map((l) => (
                      <MenuItem key={l.organizationId} value={l.organizationId}>{l.organizationName}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Tipo de operación"
                    size="small"
                    value={calcOpType}
                    onChange={(e) => setCalcOpType(e.target.value)}
                  >
                    <MenuItem value="MEMBERSHIP">MEMBERSHIP (3.00%)</MenuItem>
                    <MenuItem value="SUPPLEMENT">SUPPLEMENT (5.00%)</MenuItem>
                    <MenuItem value="GROUP_ENROLLMENT">GROUP_ENROLLMENT (2.50%)</MenuItem>
                  </TextField>
                  <TextField
                    label="Importe Bruto (PEN)"
                    size="small"
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    required
                  />
                  <TextField
                    select
                    label="Estado del cobro"
                    size="small"
                    value={calcPaymentStatus}
                    onChange={(e) => setCalcPaymentStatus(e.target.value)}
                  >
                    <MenuItem value="PAID">PAID (Cobrado / Liquidado)</MenuItem>
                    <MenuItem value="PENDING">PENDING (Pendiente — debe rechazarse)</MenuItem>
                  </TextField>
                  <Button type="submit" variant="contained">Calcular y Registrar</Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Reglas Activas de Comisión ({rules.length})</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Operación</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Tasa GYM VIP</TableCell>
                    <TableCell>Pasarela Ref.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.operationType}</TableCell>
                      <TableCell>{r.commissionType}</TableCell>
                      <TableCell>{(Number(r.percentageRate) * 100).toFixed(2)}%</TableCell>
                      <TableCell>{(Number(r.gatewayPassthroughPct) * 100).toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Ledger de Liquidaciones</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>Operación</TableCell>
                <TableCell>Bruto</TableCell>
                <TableCell>Pasarela</TableCell>
                <TableCell>Comisión SaaS</TableCell>
                <TableCell>Neto Gimnasio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.organizationName}</TableCell>
                  <TableCell>{item.operationType}</TableCell>
                  <TableCell>S/ {Number(item.grossAmountPen).toFixed(2)}</TableCell>
                  <TableCell>S/ {Number(item.gatewayFeePen).toFixed(2)}</TableCell>
                  <TableCell>S/ {Number(item.platformCommissionPen).toFixed(2)}</TableCell>
                  <TableCell>S/ {Number(item.gymNetAmountPen).toFixed(2)}</TableCell>
                  <TableCell><Chip label={item.ledgerStatus} size="small" /></TableCell>
                  <TableCell align="right">
                    {item.ledgerStatus === 'CALCULADA' && (
                      <Button size="small" onClick={() => handleMarkLedger(item.id, 'FACTURADA')}>Facturar</Button>
                    )}
                    {item.ledgerStatus === 'FACTURADA' && (
                      <Button size="small" color="success" onClick={() => handleMarkLedger(item.id, 'COBRADA')}>Marcar Cobrada</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!ledger.length && (
                <TableRow>
                  <TableCell colSpan={8} align="center">Aún no existen movimientos liquidados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
