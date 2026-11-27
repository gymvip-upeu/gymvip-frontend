import { useState } from 'react';
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { httpClient } from '../../api/httpClient';

export default function FirstPasswordPage() {
  const { token, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const newPassword = fields.get('newPassword');
    if (newPassword !== fields.get('confirmation')) {
      setMessage('Las contraseñas deben coincidir.');
      return;
    }
    setMessage('');
    setBusy(true);
    try {
      const response = await httpClient('/api/v1/auth/first-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }, token);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'No se pudo actualizar la contraseña.');
      }
      logout();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card sx={{ maxWidth: 480, mx: 'auto', mt: 8 }}>
      <CardContent>
        <Stack component="form" onSubmit={submit} spacing={2}>
          <Typography component="h1" variant="h5">Crea tu contraseña</Typography>
          <Typography>Después de guardarla, inicia sesión con tu nueva contraseña.</Typography>
          {message && <Alert severity="error">{message}</Alert>}
          <TextField name="newPassword" label="Nueva contraseña" type="password" required autoComplete="new-password"
            slotProps={{ htmlInput: { maxLength: 72 } }} />
          <TextField name="confirmation" label="Confirmar contraseña" type="password" required autoComplete="new-password"
            slotProps={{ htmlInput: { maxLength: 72 } }} />
          <Button type="submit" variant="contained" disabled={busy}>Guardar contraseña</Button>
          <Button onClick={logout}>Volver al inicio de sesión</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
