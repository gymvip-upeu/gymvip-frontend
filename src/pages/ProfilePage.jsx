import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserApi, updateCurrentUserApi } from '../api/authApi';
import { httpClient } from '../api/httpClient';
import { changeMemberPassword } from '../api/memberApi';
import { dateLabel, planTypeLabel, stateLabel } from '../components/members/memberUtils';

const roleLabels = {
  ADMIN: 'Administrador (Soporte TI)',
  GERENTE: 'Gerente General',
  RECEPCION: 'Recepción',
  AUDITOR: 'Auditor Externo',
  CLIENTE: 'Socio VIP',
};

const panelSx = {
  bgcolor: 'var(--color-bg-card)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-primary)',
  boxShadow: 'var(--shadow-sm)',
};

const labelSx = { color: 'var(--color-text-muted)', letterSpacing: '.04em' };

const inputFieldSx = {
  '& .MuiInputLabel-root': { color: 'var(--color-text-secondary)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-gold)' },
  '& .MuiOutlinedInput-root': {
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-bg-elevated)',
    '& fieldset': { borderColor: 'var(--color-border)' },
    '&:hover fieldset': { borderColor: 'var(--color-gold)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--color-gold)', borderWidth: 2 },
  },
};

function Detail({ label, value }) {
  return (
    <Box
      sx={{
        p: 1.6,
        borderRadius: 2,
        bgcolor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        minHeight: 76,
      }}
    >
      <Typography variant="caption" sx={labelSx}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.5, color: 'var(--color-text-primary)', fontWeight: 600, wordBreak: 'break-word' }}>
        {value || 'No registrado'}
      </Typography>
    </Box>
  );
}

export default function ProfilePage({ embedded = false, memberData = null, onClose }) {
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [revokingSessions, setRevokingSessions] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUserApi(token)
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
        });
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  async function submitProfileEdit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return setError('Nombre y apellido son obligatorios para actualizar tu perfil.');
    }
    setSavingProfile(true);
    try {
      const updated = await updateCurrentUserApi(
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
        },
        token
      );
      setProfile(updated);
      setEditOpen(false);
      setSuccess('Tus datos personales fueron actualizados correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (passwords.newPassword !== passwords.confirmation) {
      return setError('Las contraseñas nuevas no coinciden.');
    }
    setBusy(true);
    try {
      await changeMemberPassword(
        { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword },
        token
      );
      setSuccess('Contraseña actualizada. Por seguridad, inicia sesión nuevamente.');
      window.setTimeout(() => logout(), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeOtherSessions() {
    setError('');
    setSuccess('');
    setRevokingSessions(true);
    try {
      const res = await httpClient('/api/v1/auth/revoke-other-sessions', { method: 'POST' }, token);
      if (!res.ok) throw new Error('No se pudieron cerrar las demás sesiones.');
      setSuccess('Se cerraron todas tus demás sesiones activas en otros navegadores o dispositivos.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRevokingSessions(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
        <CircularProgress color="warning" />
      </Box>
    );
  }

  const person = memberData?.client || profile;
  const coverage = memberData?.coverage;
  const activePeriod =
    memberData?.periods?.find((period) => !period.cancelled_at_utc && period.paid) || memberData?.periods?.[0];
  const fullName = [person?.firstName, person?.lastName].filter(Boolean).join(' ') || profile?.email || user?.email;
  const rawRoles = profile?.roles || user?.roles || [];
  const roles = rawRoles
    .map((role) => (typeof role === 'string' ? role.replace(/^ROLE_/, '') : String(role?.authority || '').replace(/^ROLE_/, '')))
    .filter(Boolean);
  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const accountType = roles.includes('CLIENTE')
    ? 'Cuenta de socio'
    : roles.includes('GERENTE')
    ? 'Cuenta de gerencia'
    : roles.includes('ADMIN')
    ? 'Cuenta técnica (TI)'
    : roles.includes('RECEPCION')
    ? 'Cuenta de recepción'
    : 'Cuenta de auditoría';

  return (
    <Box sx={{ maxWidth: 1050, mx: 'auto', py: embedded ? 1 : 2, color: 'var(--color-text-primary)' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="overline" sx={{ color: 'var(--color-gold)', letterSpacing: '.16em', fontWeight: 700 }}>
            CUENTA PERSONAL
          </Typography>
          <Typography variant="h4" sx={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>
            Mi perfil
          </Typography>
          <Typography sx={{ color: 'var(--color-text-secondary)' }}>
            Consulta o actualiza tus datos personales y gestiona la seguridad de tu sesión.
          </Typography>
        </Box>
        {embedded && (
          <Button variant="outlined" color="warning" onClick={onClose}>
            Volver
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Stack spacing={2.5}>
        <Card variant="outlined" sx={panelSx}>
          <CardContent sx={{ p: { xs: 2.2, sm: 3.2 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              <Avatar
                sx={{
                  width: 82,
                  height: 82,
                  bgcolor: 'var(--color-gold)',
                  color: '#111318',
                  border: '3px solid rgba(212,175,55,0.45)',
                  fontSize: 28,
                  fontWeight: 900,
                }}
              >
                {initials}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h5" sx={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>
                  {fullName}
                </Typography>
                <Typography sx={{ color: 'var(--color-text-secondary)' }}>
                  {profile?.email || person?.email || user?.email}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>
                  {roles.map((role) => (
                    <Chip
                      key={role}
                      label={roleLabels[role] || role}
                      sx={{
                        color: 'var(--color-gold)',
                        borderColor: 'rgba(212,175,55,0.5)',
                        bgcolor: 'rgba(212,175,55,0.1)',
                        fontWeight: 600,
                      }}
                      variant="outlined"
                    />
                  ))}
                  <Chip
                    label={person?.status || profile?.status || 'ACTIVO'}
                    sx={{
                      bgcolor: 'rgba(16,185,129,0.15)',
                      color: 'var(--color-success)',
                      border: '1px solid rgba(16,185,129,0.35)',
                      fontWeight: 700,
                    }}
                  />
                </Stack>
              </Box>
              <Box
                sx={{
                  px: 2,
                  py: 1.3,
                  borderRadius: 2,
                  bgcolor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Typography variant="caption" sx={labelSx}>
                  TIPO DE PERFIL
                </Typography>
                <Typography sx={{ color: 'var(--color-gold)', fontWeight: 800 }}>{accountType}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={panelSx}>
          <CardContent sx={{ p: { xs: 2.2, sm: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ color: 'var(--color-gold)', fontWeight: 800 }}>
                Información personal
              </Typography>
              {!memberData && (
                <Button
                  variant={editOpen ? 'outlined' : 'contained'}
                  size="small"
                  onClick={() => setEditOpen((prev) => !prev)}
                  sx={
                    editOpen
                      ? { borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }
                      : { bgcolor: 'var(--color-gold)', color: '#111318', fontWeight: 700 }
                  }
                >
                  {editOpen ? 'Cancelar edición' : 'Editar mis datos'}
                </Button>
              )}
            </Stack>

            <Collapse in={editOpen} timeout="auto" unmountOnExit>
              <Box
                component="form"
                onSubmit={submitProfileEdit}
                sx={{
                  mb: 2.5,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Nombres"
                    required
                    sx={inputFieldSx}
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                  <TextField
                    fullWidth
                    label="Apellidos"
                    required
                    sx={inputFieldSx}
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                  <TextField
                    fullWidth
                    label="Teléfono de contacto"
                    placeholder="+51 999 888 777"
                    sx={inputFieldSx}
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </Stack>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingProfile}
                  sx={{ bgcolor: 'var(--color-gold)', color: '#111318', fontWeight: 800 }}
                >
                  {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </Box>
            </Collapse>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 1.5,
              }}
            >
              <Detail label="Nombres" value={person?.firstName} />
              <Detail label="Apellidos" value={person?.lastName} />
              <Detail label="Correo electrónico" value={profile?.email || person?.email || user?.email} />
              <Detail label="Teléfono" value={person?.phone || profile?.phone} />
              {person?.birthDate && <Detail label="Fecha de nacimiento" value={dateLabel(person.birthDate)} />}
              {person?.age && <Detail label="Edad" value={`${person.age} años`} />}
              {person?.memberCode && <Detail label="Código de socio" value={person.memberCode} />}
              <Detail label="Estado de la cuenta" value={person?.status || profile?.status || 'ACTIVO'} />
              <Detail label="MFA / autenticación reforzada" value={profile?.mfaEnabled ? 'Activada' : 'No activada'} />
            </Box>
          </CardContent>
        </Card>

        {memberData && (
          <Card variant="outlined" sx={{ ...panelSx, borderColor: 'rgba(212,175,55,0.5)' }}>
            <CardContent sx={{ p: { xs: 2.2, sm: 3 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={2}>
                <Box>
                  <Typography variant="overline" sx={{ color: 'var(--color-gold)' }}>
                    MEMBRESÍA ACTUAL
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'var(--color-text-primary)', fontWeight: 900 }}>
                    {coverage?.planName || 'Sin plan asignado'}
                  </Typography>
                </Box>
                <Stack direction="row" gap={1} alignItems="center">
                  <Chip
                    label={activePeriod?.duration_days ? planTypeLabel(activePeriod.duration_days) : 'Plan personalizado'}
                    sx={{ bgcolor: 'var(--color-gold)', color: '#111', fontWeight: 900 }}
                  />
                  <Chip
                    label={stateLabel(coverage?.state)}
                    sx={{
                      bgcolor: coverage?.allowed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: coverage?.allowed ? 'var(--color-success)' : 'var(--color-danger)',
                      border: '1px solid currentColor',
                    }}
                  />
                </Stack>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                <Detail label="Inicio del plan" value={dateLabel(coverage?.startDate)} />
                <Detail label="Último día válido" value={dateLabel(coverage?.lastIncludedDate)} />
                <Detail
                  label="Días restantes"
                  value={coverage?.daysRemaining == null ? '—' : `${coverage.daysRemaining} días`}
                />
                <Detail label="Asistencias acumuladas" value={String(memberData.attendanceCount ?? 0)} />
              </Box>
              {coverage?.reason && (
                <Typography sx={{ mt: 2, color: 'var(--color-text-secondary)' }}>{coverage.reason}</Typography>
              )}
            </CardContent>
          </Card>
        )}

        <Card variant="outlined" sx={panelSx}>
          <CardContent sx={{ p: { xs: 2.2, sm: 3 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
              gap={2}
            >
              <Box>
                <Typography variant="h6" sx={{ color: 'var(--color-gold)', fontWeight: 800 }}>
                  Seguridad y sesiones de tu cuenta
                </Typography>
                <Typography sx={{ color: 'var(--color-text-secondary)' }}>
                  Cierra otros dispositivos conectados o cambia tu contraseña periódicamente.
                </Typography>
              </Box>
              <Stack direction="row" gap={1.5} flexWrap="wrap">
                <Button
                  variant="outlined"
                  disabled={revokingSessions}
                  onClick={handleRevokeOtherSessions}
                  sx={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  {revokingSessions ? 'Cerrando…' : 'Cerrar otras sesiones'}
                </Button>
                <Button
                  variant="contained"
                  aria-expanded={passwordOpen}
                  aria-controls="password-change-panel"
                  onClick={() => setPasswordOpen((open) => !open)}
                  sx={{ bgcolor: 'var(--color-gold)', color: '#111318', fontWeight: 800 }}
                >
                  {passwordOpen ? 'Ocultar' : 'Cambiar contraseña'}
                </Button>
              </Stack>
            </Stack>

            <Collapse in={passwordOpen} timeout="auto" unmountOnExit>
              <Box
                id="password-change-panel"
                sx={{
                  mt: 2.5,
                  p: { xs: 1.5, sm: 2.5 },
                  borderRadius: 2,
                  bgcolor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Divider sx={{ borderColor: 'var(--color-border)', mb: 2 }} />
                <Typography sx={{ color: 'var(--color-text-primary)', fontWeight: 700, mb: 0.5 }}>
                  Actualiza tu contraseña
                </Typography>
                <Typography sx={{ color: 'var(--color-text-secondary)', mb: 2 }}>
                  Al guardar el cambio se solicitará iniciar sesión nuevamente.
                </Typography>
                <Box component="form" onSubmit={submitPassword}>
                  <Stack spacing={2} maxWidth={540}>
                    <TextField
                      sx={inputFieldSx}
                      label="Contraseña actual"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                    />
                    <TextField
                      sx={inputFieldSx}
                      label="Nueva contraseña"
                      type="password"
                      required
                      inputProps={{ minLength: 12, maxLength: 72 }}
                      autoComplete="new-password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                    />
                    <TextField
                      sx={inputFieldSx}
                      label="Repetir nueva contraseña"
                      type="password"
                      required
                      inputProps={{ minLength: 12, maxLength: 72 }}
                      autoComplete="new-password"
                      value={passwords.confirmation}
                      onChange={(e) => setPasswords((p) => ({ ...p, confirmation: e.target.value }))}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={busy}
                      sx={{ alignSelf: 'flex-start', bgcolor: 'var(--color-gold)', color: '#111318', fontWeight: 900 }}
                    >
                      {busy ? 'Actualizando…' : 'Guardar nueva contraseña'}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
