import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { createGroupPromotionApi, listGroupPromotionsApi } from '../../api/saasPlatformApi';

export default function GroupPromotionsPanel() {
  const { token, user, isBusinessExecutive } = useAuth();
  const canCreate = isBusinessExecutive?.() ?? false;
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    minParticipants: 2,
    maxParticipants: 4,
    discountPercent: 15,
    terms: 'Todos los integrantes deben aceptar la invitación en 48h.',
  });

  const loadPromos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listGroupPromotionsApi(token, {
        organizationId: user?.organizationId || '',
        onlyActive: false,
      });
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron consultar promociones grupales.');
    } finally {
      setLoading(false);
    }
  }, [token, user?.organizationId]);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      const created = await createGroupPromotionApi(token, {
        organizationId: user?.organizationId || null,
        title: form.title,
        description: form.description,
        minParticipants: Number(form.minParticipants),
        maxParticipants: Number(form.maxParticipants),
        discountPercent: Number(form.discountPercent),
        terms: form.terms,
      });
      setNotice(`Promoción grupal "${created.title}" activada con ${created.discountPercent}% de descuento.`);
      setForm((prev) => ({ ...prev, title: '', description: '' }));
      await loadPromos();
    } catch (err) {
      setError(err.message || 'Error al crear la promoción grupal.');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6">Promociones Grupales / Inscripción en Grupo (B2C)</Typography>
              <Typography variant="body2" color="text.secondary">
                Campañas colectivas con validación en backend del descuento por integrante y aceptación explícita de invitados.
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={loadPromos} disabled={loading}>Actualizar</Button>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

          <Grid container spacing={2.5}>
            {canCreate && (
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
                  <TextField label="Nombre de campaña grupal" size="small" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <TextField label="Descripción breve" size="small" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <Stack direction="row" spacing={1}>
                    <TextField label="Mín. personas" type="number" size="small" value={form.minParticipants} onChange={(e) => setForm({ ...form, minParticipants: e.target.value })} />
                    <TextField label="Máx. personas" type="number" size="small" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
                    <TextField label="% Desc." type="number" size="small" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
                  </Stack>
                  <TextField label="Condiciones" size="small" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
                  <Button type="submit" variant="contained">Crear Promoción Grupal</Button>
                </Stack>
              </Grid>
            )}

            <Grid size={{ xs: 12, md: canCreate ? 7 : 12 }}>
              <Stack spacing={1.5}>
                {promos.map((p) => (
                  <Box key={p.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" fontWeight={700}>{p.title}</Typography>
                      <Chip label={`-${p.discountPercent}% · ${p.minParticipants}-${p.maxParticipants} pers.`} size="small" color="primary" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{p.description || p.terms}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Vigencia: {p.validFrom} a {p.validUntil} · Estado: {p.status}
                    </Typography>
                  </Box>
                ))}
                {!promos.length && (
                  <Typography variant="body2" color="text.secondary">No hay promociones grupales registradas.</Typography>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
