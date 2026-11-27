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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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

const WEEK = [
  ['monday', 'Lunes'], ['tuesday', 'Martes'], ['wednesday', 'Miércoles'],
  ['thursday', 'Jueves'], ['friday', 'Viernes'], ['saturday', 'Sábado'], ['sunday', 'Domingo'],
];

function readJson(value, fallback) {
  try {
    return typeof value === 'string' ? JSON.parse(value) ?? fallback : value ?? fallback;
  } catch {
    return fallback;
  }
}

function readLines(value) {
  const decoded = readJson(value, []);
  return Array.isArray(decoded) ? decoded.filter((item) => typeof item === 'string').join('\n') : '';
}

function publicPhoto(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function buildSchedule(value) {
  const source = readJson(value, {});
  return Object.fromEntries(WEEK.map(([day], index) => [day, source[day] ?? (index < 5 ? source.weekdays : '') ?? '']));
}

const lines = (value) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

export default function CommercialProfilePage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    organizationId: user?.organizationId || '',
    slug: '',
    headline: '',
    tagline: '',
    aboutText: '',
    services: '',
    hours: buildSchedule(null),
    gallery: '',
    referencePlansJson: '[]',
    contactWhatsapp: '',
    instagramHandle: '',
    websiteUrl: '',
    publishStatus: 'BORRADOR',
    hasPublishedVersion: false,
  });
  const [reviews, setReviews] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProfileAndReviews = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoaded(false);
    setError('');
    setReviewError('');
    try {
      const profile = await getCommercialProfileApi(token, user?.organizationId || '');
      setForm({
        organizationId: profile.organizationId || user?.organizationId || '',
        slug: profile.slug || '',
        headline: profile.headline || '',
        tagline: profile.tagline || '',
        aboutText: profile.aboutText || '',
        services: readLines(profile.amenitiesJson),
        hours: buildSchedule(profile.scheduleJson),
        gallery: readLines(profile.galleryUrlsJson),
        referencePlansJson: profile.referencePlansJson || '[]',
        contactWhatsapp: profile.contactWhatsapp || '',
        instagramHandle: profile.instagramHandle || '',
        websiteUrl: profile.websiteUrl || '',
        publishStatus: profile.publishStatus || 'BORRADOR',
        hasPublishedVersion: Boolean(profile.hasPublishedVersion || profile.publishStatus === 'PUBLICADO'),
      });
      setLoaded(true);
      if (profile.organizationId) {
        try {
          const rev = await listGymReviewsApi(profile.organizationId);
          setReviews(Array.isArray(rev) ? rev : []);
        } catch {
          setReviewError('No se pudieron cargar las reseñas.');
        }
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

  const handleSave = async (publishStatus) => {
    if (!loaded || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { services, gallery, hours, organizationId, hasPublishedVersion, ...data } = form;
      const saved = await saveCommercialProfileApi(token, {
        ...data,
        organizationId: organizationId || undefined,
        publishStatus,
        amenitiesJson: JSON.stringify(lines(services)),
        galleryUrlsJson: JSON.stringify(lines(gallery)),
        scheduleJson: JSON.stringify(Object.fromEntries(Object.entries(hours).filter(([, value]) => value.trim()))),
      });
      setForm((current) => ({ ...current, slug: saved.slug, publishStatus: saved.publishStatus, hasPublishedVersion: Boolean(saved.hasPublishedVersion) }));
      setNotice(publishStatus === 'PUBLICADO' ? 'Ficha publicada.' : hasPublishedVersion ? 'Borrador guardado. La ficha publicada sigue visible.' : 'Ficha guardada como borrador.');
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil comercial.');
    } finally {
      setSaving(false);
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
      <Typography variant="h4" mb={1}>Perfil comercial público</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Edita los datos que verán socios y visitantes al explorar tu gimnasio.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Datos de Publicación</Typography>
                  <Chip label={form.hasPublishedVersion && form.publishStatus === 'BORRADOR' ? 'Borrador y versión publicada' : form.publishStatus} color={form.publishStatus === 'PUBLICADO' ? 'success' : 'warning'} size="small" />
                </Stack>
                <TextField label="Slug URL pública" size="small" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <TextField label="Titular Comercial" size="small" required value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                <TextField label="Subtítulo / Propuesta de valor" size="small" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
                <TextField label="Descripción del gimnasio" multiline rows={3} size="small" value={form.aboutText} onChange={(e) => setForm({ ...form, aboutText: e.target.value })} />
                <TextField label="Servicios" helperText="Escribe un servicio por línea." multiline minRows={2} value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />
                <Typography variant="subtitle1">Horario de atención</Typography>
                <Grid container spacing={1.5}>
                  {WEEK.map(([day, label]) => (
                    <Grid key={day} size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label={label} placeholder="06:00–22:00 o Cerrado" value={form.hours[day]}
                        onChange={(e) => setForm({ ...form, hours: { ...form.hours, [day]: e.target.value } })} />
                    </Grid>
                  ))}
                </Grid>
                <TextField label="Fotos" helperText="Pega un enlace HTTPS por línea." multiline minRows={2} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} />
                <Grid container spacing={1.5}>
                  {[
                    ['contactWhatsapp', 'WhatsApp comercial'], ['instagramHandle', 'Instagram'], ['websiteUrl', 'Sitio web'],
                  ].map(([key, label]) => (
                    <Grid key={key} size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth size="small" label={label} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                    </Grid>
                  ))}
                </Grid>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button disabled={!loaded || saving} onClick={() => setPreview(true)}>Vista previa</Button>
                  <Button variant="outlined" disabled={!loaded || saving} onClick={() => handleSave('BORRADOR')}>Guardar borrador</Button>
                  <Button variant="contained" disabled={!loaded || saving || !form.headline.trim()} onClick={() => handleSave('PUBLICADO')}>Publicar</Button>
                </Stack>
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
              {reviewError && <Alert severity="warning">{reviewError}</Alert>}
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
                {!reviews.length && !reviewError && (
                  <Typography variant="body2" color="text.secondary">Aún no se registran reseñas verificadas.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Dialog open={preview} onClose={() => setPreview(false)} fullWidth>
        <DialogTitle>{form.headline || 'Ficha comercial'}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            {lines(form.gallery).map(publicPhoto).filter(Boolean).slice(0, 3).map((photo, index) => (
              <Box key={index} component="img" src={photo} alt="Instalaciones del gimnasio" referrerPolicy="no-referrer"
                sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 2 }} />
            ))}
            {form.tagline && <Typography color="text.secondary">{form.tagline}</Typography>}
            {form.aboutText && <Typography>{form.aboutText}</Typography>}
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
              {lines(form.services).map((service, index) => <Chip key={index} label={service} />)}
            </Stack>
            {WEEK.filter(([day]) => form.hours[day]).map(([day, label]) => <Typography key={day}>{label} · {form.hours[day]}</Typography>)}
            {[form.contactWhatsapp, form.instagramHandle, form.websiteUrl].filter(Boolean).map((value, index) => (
              <Typography key={index} variant="body2" color="text.secondary">{value}</Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setPreview(false)}>Cerrar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
