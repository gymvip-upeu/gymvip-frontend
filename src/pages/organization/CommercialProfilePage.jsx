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
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCommercialProfileApi,
  listGymReviewsApi,
  replyGymReviewApi,
  saveCommercialProfileApi,
} from '../../api/saasPlatformApi';

export default function CommercialProfilePage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    organizationId: user?.organizationId || '',
    slug: '',
    headline: '',
    tagline: '',
    aboutText: '',
    amenitiesJson: '[]',
    scheduleJson: '{}',
    contactWhatsapp: '',
    instagramHandle: '',
    websiteUrl: '',
    publishStatus: 'BORRADOR',
  });
  const [reviews, setReviews] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProfileAndReviews = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const profile = await getCommercialProfileApi(token, user?.organizationId || '');
      setForm({
        organizationId: profile.organizationId || user?.organizationId || '',
        slug: profile.slug || '',
        headline: profile.headline || '',
        tagline: profile.tagline || '',
        aboutText: profile.aboutText || '',
        amenitiesJson: profile.amenitiesJson || '[]',
        scheduleJson: profile.scheduleJson || '{}',
        contactWhatsapp: profile.contactWhatsapp || '',
        instagramHandle: profile.instagramHandle || '',
        websiteUrl: profile.websiteUrl || '',
        publishStatus: profile.publishStatus || 'BORRADOR',
      });
      if (profile.organizationId) {
        const rev = await listGymReviewsApi(profile.organizationId);
        setReviews(Array.isArray(rev) ? rev : []);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar el perfil comercial.');
    } finally {
      setLoading(false);
    }
  }, [token, user?.organizationId]);

  useEffect(() => {
    loadProfileAndReviews();
  }, [loadProfileAndReviews]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      const saved = await saveCommercialProfileApi(token, form);
      setNotice(`Ficha comercial guardada (${saved.publishStatus}). Los cambios ya se reflejan en el explorador público B2C.`);
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil comercial.');
    }
  };

  const handleReplyReview = async (reviewId) => {
    const text = (replyDrafts[reviewId] || '').trim();
    if (!text) return;
    setError('');
    try {
      await replyGymReviewApi(token, form.organizationId, reviewId, text);
      setNotice('Respuesta oficial publicada en la reseña.');
      await loadProfileAndReviews();
    } catch (err) {
      setError(err.message || 'No se pudo responder a la reseña.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Typography variant="h4" mb={1}>Perfil Comercial Público del Gimnasio</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Administra tu vitrina pública para socios y visitantes sin registro previo (amenities, horarios, WhatsApp y reseñas verificadas).
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack component="form" spacing={2} onSubmit={handleSave}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Datos de Publicación</Typography>
                  <Chip label={form.publishStatus} color={form.publishStatus === 'PUBLICADO' ? 'success' : 'warning'} size="small" />
                </Stack>
                <TextField label="Slug URL pública" size="small" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <TextField label="Titular Comercial" size="small" required value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                <TextField label="Subtítulo / Propuesta de valor" size="small" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
                <TextField label="Descripción del gimnasio" multiline rows={3} size="small" value={form.aboutText} onChange={(e) => setForm({ ...form, aboutText: e.target.value })} />
                <TextField label="Amenities (JSON array)" size="small" value={form.amenitiesJson} onChange={(e) => setForm({ ...form, amenitiesJson: e.target.value })} />
                <TextField label="Horarios (JSON)" size="small" value={form.scheduleJson} onChange={(e) => setForm({ ...form, scheduleJson: e.target.value })} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="WhatsApp Comercial" fullWidth size="small" value={form.contactWhatsapp} onChange={(e) => setForm({ ...form, contactWhatsapp: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Instagram" fullWidth size="small" value={form.instagramHandle} onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField select label="Estado publicación" fullWidth size="small" value={form.publishStatus} onChange={(e) => setForm({ ...form, publishStatus: e.target.value })}>
                      <MenuItem value="BORRADOR">BORRADOR</MenuItem>
                      <MenuItem value="PUBLICADO">PUBLICADO</MenuItem>
                      <MenuItem value="OCULTO">OCULTO</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained">Guardar y Actualizar Vitrina</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Reseñas Verificadas de Socios ({reviews.length})</Typography>
              <Typography variant="caption" color="text.secondary">
                Solo socios con vínculo real pueden publicar reseñas; las sedes pueden responder de forma transparente.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                {reviews.map((r) => (
                  <Box key={r.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Chip label={`★ ${r.ratingOverall}/5`} size="small" color="primary" />
                      <Chip label={r.verifiedEligibilitySource} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="body2" mb={1}>{r.comment}</Typography>
                    {r.gymReply ? (
                      <Alert severity="info">Respuesta oficial: {r.gymReply}</Alert>
                    ) : (
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Responder oficialmente..."
                          value={replyDrafts[r.id] || ''}
                          onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        />
                        <Button size="small" variant="outlined" onClick={() => handleReplyReview(r.id)}>Responder</Button>
                      </Stack>
                    )}
                  </Box>
                ))}
                {!reviews.length && (
                  <Typography variant="body2" color="text.secondary">Aún no se registran reseñas verificadas.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
