import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { calculateSimulatorApi } from '../../api/saasPlatformApi';

export default function SimulatorPage() {
  const { token } = useAuth();
  const [params, setParams] = useState({
    activeGyms: 15,
    avgMonthlySaaSFeePen: 349,
    avgMembersPerGym: 180,
    avgTicketPen: 120,
    digitalSharePct: 0.45,
    platformCommissionPct: 0.03,
    gatewayCostPct: 0.0344,
    monthlyInfraCostPen: 1100,
    fixedOpsCostPen: 2200,
    supportCostPerGymPen: 35,
  });
  const [projection, setProjection] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (field) => (e) => {
    setParams((prev) => ({ ...prev, [field]: Number(e.target.value) || 0 }));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await calculateSimulatorApi(token, params);
      setProjection(res);
    } catch (err) {
      setError(err.message || 'No se pudo ejecutar la simulación financiera.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Typography variant="h4" mb={1}>Simulador de Ingresos, Costos y Sostenibilidad SaaS</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Proyección determinística ejecutada en backend para validar precios de planes B2B, tasa de comisión, costos cloud y punto de equilibrio.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Parámetros del Escenario</Typography>
              <Stack component="form" spacing={2} onSubmit={handleCalculate}>
                <TextField label="Gimnasios Activos" type="number" size="small" value={params.activeGyms} onChange={handleChange('activeGyms')} />
                <TextField label="Fee SaaS Promedio Mensual (PEN)" type="number" size="small" value={params.avgMonthlySaaSFeePen} onChange={handleChange('avgMonthlySaaSFeePen')} />
                <TextField label="Socios Promedio por Gimnasio" type="number" size="small" value={params.avgMembersPerGym} onChange={handleChange('avgMembersPerGym')} />
                <TextField label="Ticket Promedio Socio (PEN)" type="number" size="small" value={params.avgTicketPen} onChange={handleChange('avgTicketPen')} />
                <TextField label="Adopción Pago Digital (0-1)" type="number" inputProps={{ step: '0.05' }} size="small" value={params.digitalSharePct} onChange={handleChange('digitalSharePct')} />
                <TextField label="Comisión GYM VIP (0-0.15)" type="number" inputProps={{ step: '0.005' }} size="small" value={params.platformCommissionPct} onChange={handleChange('platformCommissionPct')} />
                <TextField label="Costo Infraestructura Azure + Comms (PEN)" type="number" size="small" value={params.monthlyInfraCostPen} onChange={handleChange('monthlyInfraCostPen')} />
                <TextField label="Costos Operativos Fijos (PEN)" type="number" size="small" value={params.fixedOpsCostPen} onChange={handleChange('fixedOpsCostPen')} />
                <TextField label="Soporte / Onboarding por Gimnasio (PEN)" type="number" size="small" value={params.supportCostPerGymPen} onChange={handleChange('supportCostPerGymPen')} />
                <Button type="submit" variant="contained" disabled={busy}>
                  {busy ? 'Calculando...' : 'Calcular Escenario en Backend'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          {projection ? (
            <Stack spacing={2}>
              {projection.alerts?.map((msg, idx) => (
                <Alert severity="warning" key={idx}>{msg}</Alert>
              ))}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card><CardContent>
                    <Typography variant="caption" color="primary.light">MRR SUSCRIPCIONES</Typography>
                    <Typography variant="h5">S/ {Number(projection.mrrPen).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">ARR anualizado: S/ {Number(projection.arrPen).toFixed(2)}</Typography>
                  </CardContent></Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card><CardContent>
                    <Typography variant="caption" color="primary.light">COMISIONES TRANSACCIONALES</Typography>
                    <Typography variant="h5">S/ {Number(projection.grossCommissionRevenuePen).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">Sobre volumen digital de S/ {Number(projection.gymsGrossDigitalVolumePen).toFixed(2)}</Typography>
                  </CardContent></Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card><CardContent>
                    <Typography variant="caption" color="success.main">INGRESO TOTAL GYM VIP</Typography>
                    <Typography variant="h5">S/ {Number(projection.totalPlatformRevenuePen).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">Costos totales: S/ {Number(projection.totalDirectAndFixedCostsPen).toFixed(2)}</Typography>
                  </CardContent></Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card><CardContent>
                    <Typography variant="caption" color="info.main">MARGEN OPERATIVO / EQUILIBRIO</Typography>
                    <Typography variant="h5">S/ {Number(projection.operatingMarginPen).toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">Punto equilibrio: {projection.breakEvenGyms} gimnasios</Typography>
                  </CardContent></Card>
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <Alert severity="info">Ajusta los parámetros y presiona "Calcular Escenario en Backend" para obtener el análisis de sostenibilidad.</Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
