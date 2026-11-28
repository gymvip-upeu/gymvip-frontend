import React, { useEffect, useState, useCallback } from 'react';
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CompanyWorkspace from './CompanyWorkspace';
import { useAuth } from '../../contexts/AuthContext';
import {
  exportOrganizationPortableApi,
  getPlatformMetricsApi,
  listLicensesApi,
} from '../../api/saasPlatformApi';

function formatPen(value) {
  const num = Number(value || 0);
  return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PlatformDashboardPage({ onNavigate, company, onSelectCompany }) {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportNotice, setExportNotice] = useState('');

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [m, l] = await Promise.all([
        getPlatformMetricsApi(token),
        listLicensesApi(token),
      ]);
      setMetrics(m);
      setLicenses(Array.isArray(l) ? l : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las métricas globales SaaS.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportPortable = async (orgId, orgName) => {
    setExportNotice('');
    try {
      const payload = await exportOrganizationPortableApi(token, orgId);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymvip-portabilidad-${orgId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice(`Exportación histórica portable generada para "${orgName}" (${payload.commissionLedgerCount || 0} movimientos).`);
    } catch (err) {
      setError(err.message || 'No se pudo exportar el resumen portable.');
    }
  };

  if (company) return <CompanyWorkspace key={company.organizationId} token={token} company={company} onExit={() => onSelectCompany(null)} />;

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Chip label="EXCLUSIVO SUPER_ADMIN · OPERADOR SAAS" color="primary" size="small" sx={{ mb: 1 }} />
          <Typography variant="h4">Consola Global SaaS GYM VIP 2.0</Typography>
          <Typography variant="body2" color="text.secondary">
            Supervisión multiempresa diferenciada: ingresos propios de plataforma frente al volumen operado por gimnasios afiliados.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={() => onNavigate?.('platformRequests')}>Solicitudes B2B</Button>
          <Button variant="outlined" onClick={() => onNavigate?.('platformSimulator')}>Simulador Financiero</Button>
          <Button variant="contained" onClick={loadData} disabled={loading}>Actualizar</Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {exportNotice && <Alert severity="success" sx={{ mb: 2 }}>{exportNotice}</Alert>}

      {metrics && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            {metrics.revenueSeparationNotice}
          </Alert>

          <Grid container spacing={2.5} mb={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="primary.light">INGRESO SAAS MENSUAL (MRR)</Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>{formatPen(metrics.platformMrrPen)}</Typography>
                  <Typography variant="body2" color="text.secondary">Suscripciones activas B2B</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="primary.light">COMISIONES GYM VIP</Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>{formatPen(metrics.platformCommissionsPen)}</Typography>
                  <Typography variant="body2" color="text.secondary">Ledger liquidado transparente</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="info.main">VOLUMEN DIGITAL GIMNASIOS</Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>{formatPen(metrics.gymsDigitalGrossVolumePen)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Neto gimnasios: {formatPen(metrics.gymsDigitalNetVolumePen)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">RED ACTIVA & ONBOARDING</Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {metrics.totalLicensedOrganizations} empresas · {metrics.totalActiveBranches} sedes
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    {metrics.pendingCompanyRequests} solicitudes pendientes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6">Empresas Licenciadas y Portabilidad</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Incluso ante suspensión comercial, la exportación histórica de la empresa permanece habilitada.
                  </Typography>
                </Box>
                <Button size="small" onClick={() => onNavigate?.('platformLicenses')}>Gestionar licencias y comisiones</Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Empresa</TableCell>
                    <TableCell>RUC</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Límites</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell align="right">Portabilidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {licenses.map((lic) => (
                    <TableRow key={lic.id}>
                      <TableCell>{lic.organizationName}</TableCell>
                      <TableCell>{lic.taxId || '—'}</TableCell>
                      <TableCell><Chip label={lic.planCode} size="small" variant="outlined" /></TableCell>
                      <TableCell>
                        <Chip
                          label={lic.status}
                          size="small"
                          color={lic.status === 'ACTIVA' ? 'success' : lic.status === 'TRIAL' ? 'info' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{lic.maxBranches} sedes / {lic.maxUsers} usuarios</TableCell>
                      <TableCell>{lic.expiresAt}</TableCell>
                      <TableCell align="right">
                        {onSelectCompany && <Button size="small" onClick={() => onSelectCompany(lic)}>Abrir empresa</Button>}
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => handleExportPortable(lic.organizationId, lic.organizationName)}
                        >
                          Exportar JSON
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!licenses.length && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No hay licencias registradas aún.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
