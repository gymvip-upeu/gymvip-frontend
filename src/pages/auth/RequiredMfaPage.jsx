import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { enrollMfaApi, verifyMfaApi } from '../../api/staffApi';
import QrCodeSvg from '../../components/common/QrCodeSvg';
import { useAuth } from '../../contexts/AuthContext';

export default function RequiredMfaPage() {
  const { token, logout } = useAuth();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  async function start() {
    setBusy(true);
    setError('');
    try {
      const data = await enrollMfaApi(token);
      setSetup(data);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    if (busy || code.length !== 6) return;
    setBusy(true);
    setError('');
    try {
      await verifyMfaApi(code, token);
      setSetup(null);
      setCode('');
      setComplete(true);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card sx={{ maxWidth: 560, m: { xs: 2, sm: '48px auto' } }}>
      <CardContent>
        <Stack spacing={2} component="form" onSubmit={verify}>
          <Typography component="h1" variant="h5">Protege tu cuenta de plataforma</Typography>
          {complete ? (
            <>
              <Alert severity="success">Autenticación activada. Vuelve a ingresar con tu contraseña y el código de la app autenticadora.</Alert>
              <Button onClick={logout} variant="contained">Volver a iniciar sesión</Button>
            </>
          ) : (
            <>
              <Typography>Configura la autenticación de dos factores para acceder a la consola de GYM VIP.</Typography>
              {error && <Alert severity="error">{error}</Alert>}
              {!setup ? (
                <Button type="button" onClick={start} disabled={busy} variant="contained">
                  {busy ? 'Preparando…' : 'Configurar TOTP'}
                </Button>
              ) : (
                <>
                  <Typography>Escanea el código QR o añade la clave manualmente en tu app autenticadora.</Typography>
                  <Box sx={{ alignSelf: 'center' }} aria-label="Código QR de configuración TOTP">
                    <QrCodeSvg value={setup.otpauthUri} color="#000" bgColor="#fff" margin={4} size={200} />
                  </Box>
                  <TextField label="Clave manual" value={setup.secret} slotProps={{ input: { readOnly: true } }} />
                  <Typography>Guarda estos códigos de recuperación en un lugar seguro.</Typography>
                  <Box component="code" sx={{ overflowWrap: 'anywhere', fontSize: '0.95rem' }}>
                    {setup.recoveryCodes?.join(' · ')}
                  </Box>
                  <TextField label="Código de seis dígitos" value={code}
                    onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6 } }} />
                  <Button type="submit" disabled={busy || code.length !== 6} variant="contained">Verificar y activar</Button>
                </>
              )}
              <Button type="button" onClick={logout} disabled={busy}>Cerrar sesión</Button>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
