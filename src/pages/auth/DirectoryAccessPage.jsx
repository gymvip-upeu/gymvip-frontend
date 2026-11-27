import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function DirectoryAccessPage() {
  const { logout } = useAuth();

  return (
    <Card sx={{ maxWidth: 480, mx: 'auto', mt: 8 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography component="h1" variant="h5">Explora gimnasios</Typography>
          <Typography>Tu cuenta está lista para explorar el directorio. Los módulos del socio requieren una membresía activa.</Typography>
          <Button component="a" href="https://gymvip.vercel.app/gimnasios/" variant="contained">
            Abrir directorio
          </Button>
          <Button onClick={logout}>Cerrar sesión</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
