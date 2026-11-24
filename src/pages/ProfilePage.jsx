import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Collapse, Divider, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserApi } from '../api/authApi';
import { changeMemberPassword } from '../api/memberApi';
import { dateLabel, planTypeLabel, stateLabel } from '../components/members/memberUtils';

const roleLabels = { ADMIN: 'Administrador', RECEPCION: 'Recepción', AUDITOR: 'Auditor', CLIENTE: 'Socio' };

const panelSx = { bgcolor: '#17191f', borderColor: '#4b4228', color: '#f5eedc', boxShadow: '0 18px 44px rgba(0,0,0,.24)' };
const labelSx = { color: '#b9b09c', letterSpacing: '.04em' };
const passwordFieldSx = {
  '& .MuiInputLabel-root': { color: '#d9d1bf' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#f2c94c' },
  '& .MuiOutlinedInput-root': {
    color: '#fff8e7',
    backgroundColor: '#242731',
    '& fieldset': { borderColor: '#807348', borderWidth: 1 },
    '&:hover fieldset': { borderColor: '#d4af37' },
    '&.Mui-focused fieldset': { borderColor: '#f2c94c', borderWidth: 2 },
  },
  '& input:-webkit-autofill': { WebkitTextFillColor: '#fff8e7', WebkitBoxShadow: '0 0 0 100px #242731 inset' },
};

function Detail({ label, value }) {
  return <Box sx={{ p: 1.6, borderRadius: 2, bgcolor: '#202229', border: '1px solid #363329', minHeight: 76 }}><Typography variant="caption" sx={labelSx}>{label}</Typography><Typography sx={{ mt: .5, color: '#fff8e7', fontWeight: 600, wordBreak: 'break-word' }}>{value || 'No registrado'}</Typography></Box>;
}

export default function ProfilePage({ embedded = false, memberData = null, onClose }) {
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' });

  useEffect(() => {
    let active = true;
    getCurrentUserApi(token).then(data => active && setProfile(data)).catch(err => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  async function submitPassword(event) {
    event.preventDefault();
    setError(''); setSuccess('');
    if (passwords.newPassword !== passwords.confirmation) return setError('Las contraseñas nuevas no coinciden.');
    setBusy(true);
    try {
      await changeMemberPassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }, token);
      setSuccess('Contraseña actualizada. Por seguridad, inicia sesión nuevamente.');
      window.setTimeout(() => logout(), 1200);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (loading) return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}><CircularProgress color="warning" /></Box>;
  const person = memberData?.client || profile;
  const coverage = memberData?.coverage;
  const activePeriod = memberData?.periods?.find(period => !period.cancelled_at_utc && period.paid) || memberData?.periods?.[0];
  const fullName = [person?.firstName, person?.lastName].filter(Boolean).join(' ') || profile?.email || user?.email;
  const rawRoles = profile?.roles || user?.roles || [];
  const roles = rawRoles.map(role => typeof role === 'string' ? role.replace(/^ROLE_/, '') : String(role?.authority || '').replace(/^ROLE_/, '')).filter(Boolean);
  const initials = fullName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  const accountType = roles.includes('CLIENTE') ? 'Cuenta de socio' : roles.includes('ADMIN') ? 'Cuenta administrativa' : roles.includes('RECEPCION') ? 'Cuenta de recepción' : 'Cuenta de auditoría';

  return <Box sx={{ maxWidth: 1050, mx: 'auto', py: embedded ? 1 : 2, color: '#f5eedc' }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
      <Box><Typography variant="overline" sx={{ color: '#e6bd4b', letterSpacing: '.16em' }}>CUENTA PERSONAL</Typography><Typography variant="h4" sx={{ color: '#fff8e7', fontWeight: 800 }}>Mi perfil</Typography><Typography sx={{ color: '#b9b09c' }}>Información personal, membresía y seguridad de tu cuenta Gym VIP.</Typography></Box>
      {embedded && <Button variant="outlined" color="warning" onClick={onClose}>Volver</Button>}
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    <Stack spacing={2.5}>
      <Card variant="outlined" sx={panelSx}><CardContent sx={{ p: { xs: 2.2, sm: 3.2 } }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}><Avatar sx={{ width: 82, height: 82, bgcolor: '#d4af37', color: '#111318', border: '4px solid #75601e', fontSize: 28, fontWeight: 900 }}>{initials}</Avatar><Box flex={1}><Typography variant="h5" sx={{ color: '#fff8e7', fontWeight: 800 }}>{fullName}</Typography><Typography sx={{ color: '#c8bfa9' }}>{profile?.email || person?.email || user?.email}</Typography><Stack direction="row" flexWrap="wrap" gap={1} mt={1.5}>{roles.map(role => <Chip key={role} label={roleLabels[role] || role} sx={{ color: '#ffe7a3', borderColor: '#a98627', bgcolor: '#2b2618' }} variant="outlined" />)}<Chip label={person?.status || profile?.status || 'ACTIVO'} sx={{ bgcolor: '#173326', color: '#8ee0b5', border: '1px solid #315f49' }} /></Stack></Box><Box sx={{ px: 2, py: 1.3, borderRadius: 2, bgcolor: '#2b2618', border: '1px solid #6f5b20' }}><Typography variant="caption" sx={labelSx}>TIPO DE PERFIL</Typography><Typography sx={{ color: '#f2c94c', fontWeight: 800 }}>{accountType}</Typography></Box></Stack></CardContent></Card>

      <Card variant="outlined" sx={panelSx}><CardContent sx={{ p: { xs: 2.2, sm: 3 } }}><Typography variant="h6" sx={{ color: '#f2c94c', fontWeight: 800, mb: 2 }}>Información personal</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1.5 }}><Detail label="Nombres" value={person?.firstName} /><Detail label="Apellidos" value={person?.lastName} /><Detail label="Correo electrónico" value={profile?.email || person?.email || user?.email} /><Detail label="Teléfono" value={person?.phone || profile?.phone} /><Detail label="Fecha de nacimiento" value={person?.birthDate ? dateLabel(person.birthDate) : null} /><Detail label="Edad" value={person?.age ? `${person.age} años` : null} />{person?.memberCode && <Detail label="Código de socio" value={person.memberCode} />}<Detail label="Estado de la cuenta" value={person?.status || profile?.status || 'ACTIVO'} /><Detail label="MFA / autenticación reforzada" value={profile?.mfaEnabled ? 'Activada' : 'No activada'} /></Box></CardContent></Card>

      {memberData && <Card variant="outlined" sx={{ ...panelSx, borderColor: '#80691f', background: 'linear-gradient(135deg,#1c1d22 0%,#272215 100%)' }}><CardContent sx={{ p: { xs: 2.2, sm: 3 } }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={2}><Box><Typography variant="overline" sx={{ color: '#c8b45e' }}>MEMBRESÍA ACTUAL</Typography><Typography variant="h5" sx={{ color: '#fff4ce', fontWeight: 900 }}>{coverage?.planName || 'Sin plan asignado'}</Typography></Box><Stack direction="row" gap={1} alignItems="center"><Chip label={activePeriod?.duration_days ? planTypeLabel(activePeriod.duration_days) : 'Plan personalizado'} sx={{ bgcolor: '#d4af37', color: '#111', fontWeight: 900 }} /><Chip label={stateLabel(coverage?.state)} sx={{ bgcolor: coverage?.allowed ? '#173326' : '#3c2020', color: coverage?.allowed ? '#8ee0b5' : '#ffb4ab', border: '1px solid currentColor' }} /></Stack></Stack><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}><Detail label="Inicio del plan" value={dateLabel(coverage?.startDate)} /><Detail label="Último día válido" value={dateLabel(coverage?.lastIncludedDate)} /><Detail label="Días restantes" value={coverage?.daysRemaining == null ? '—' : `${coverage.daysRemaining} días`} /><Detail label="Asistencias acumuladas" value={String(memberData.attendanceCount ?? 0)} /></Box>{coverage?.reason && <Typography sx={{ mt: 2, color: '#d5ccb9' }}>{coverage.reason}</Typography>}</CardContent></Card>}

      <Card variant="outlined" sx={panelSx}><CardContent sx={{ p: { xs: 2.2, sm: 3 } }}><Box sx={{ position: 'relative', minHeight: { sm: 62 } }}><Box><Typography variant="h6" sx={{ color: '#f2c94c', fontWeight: 800 }}>Seguridad de la cuenta</Typography><Typography sx={{ color: '#b9b09c' }}>Actualiza tu contraseña periódicamente para mantener protegida tu cuenta.</Typography></Box><Button variant="text" aria-expanded={passwordOpen} aria-controls="password-change-panel" onClick={() => setPasswordOpen(open => !open)} sx={{ position: { xs: 'static', sm: 'absolute' }, display: { xs: 'block', sm: 'inline-flex' }, mt: { xs: 2, sm: 0 }, ml: { xs: 0, sm: 0 }, left: { sm: '70%' }, top: { sm: '50%' }, transform: { sm: 'translateY(-50%)' }, minWidth: 0, px: 1.5, py: .75, borderRadius: 1.5, color: '#17191f', backgroundColor: '#f2c94c', fontSize: '.82rem', fontWeight: 900, letterSpacing: '.02em', '&:hover': { backgroundColor: '#ffe08a' } }}>{passwordOpen ? 'Cerrar' : 'Cambiar contraseña'}</Button></Box><Collapse in={passwordOpen} timeout="auto" unmountOnExit><Box id="password-change-panel" sx={{ mt: 2.5, p: { xs: 1.5, sm: 2.5 }, borderRadius: 2, backgroundColor: '#111318', border: '1px solid #6f5b20' }}><Divider sx={{ borderColor: '#39362c', mb: 2 }} /><Typography sx={{ color: '#fff4ce', fontWeight: 700, mb: .5 }}>Actualiza tu contraseña</Typography><Typography sx={{ color: '#c8bfa9', mb: 2 }}>Al guardar el cambio se solicitará iniciar sesión nuevamente.</Typography><Box component="form" onSubmit={submitPassword}><Stack spacing={2} maxWidth={540}><TextField sx={passwordFieldSx} label="Contraseña actual" type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} /><TextField sx={passwordFieldSx} label="Nueva contraseña" type="password" required inputProps={{ minLength: 12, maxLength: 72 }} autoComplete="new-password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} /><TextField sx={passwordFieldSx} label="Repetir nueva contraseña" type="password" required inputProps={{ minLength: 12, maxLength: 72 }} autoComplete="new-password" value={passwords.confirmation} onChange={e => setPasswords(p => ({ ...p, confirmation: e.target.value }))} /><Button type="submit" variant="contained" disabled={busy} sx={{ alignSelf: 'flex-start', bgcolor: '#d4af37', color: '#121212', fontWeight: 900, '&:hover': { bgcolor: '#f0c84b' } }}>{busy ? 'Actualizando…' : 'Guardar nueva contraseña'}</Button></Stack></Box></Box></Collapse></CardContent></Card>
    </Stack>
  </Box>;
}
