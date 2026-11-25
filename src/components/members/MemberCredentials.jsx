import React, { useEffect, useState } from 'react';
import { httpClient } from '../../api/httpClient';
import { useAuth } from '../../contexts/AuthContext';
import MemberDialog from './MemberDialog';
import { Button } from '../common/Button';

const descriptions = {
  QUEUED: 'Enviando invitación al correo registrado…',
  ACCEPTED: 'Invitación enviada por correo. El miembro tiene 24 horas para activar su cuenta.',
  SIMULATED: 'Correo generado en modo de simulación local.',
  FAILED: 'No se pudo enviar el correo. Puedes reenviar la invitación o entregar la contraseña temporal al miembro.',
  TEST_DISABLED: 'Envío de correo deshabilitado en este entorno.',
};

export default function MemberCredentials({ credentials, onClose }) {
  const { token } = useAuth();
  const [current, setCurrent] = useState(credentials);
  const [status, setStatus] = useState(credentials.emailDeliveryStatus);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!current.invitationId) return undefined;
    let disposed = false;
    let timer;
    let attempts = 0;
    async function check() {
      try {
        const response = await httpClient(`/api/v1/members/access-invitations/${current.invitationId}`, {}, token);
        if (!response.ok) throw new Error('No se pudo consultar el envío.');
        const result = await response.json();
        if (disposed) return;
        setStatus(result.status);
        setError('');
        if (result.status === 'QUEUED' && ++attempts < 8) {
          timer = setTimeout(check, 1500);
        }
      } catch {
        if (!disposed) setError('No se pudo verificar el envío. Actualiza su estado.');
      }
    }
    check();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [current.invitationId, token, refresh]);

  async function resend() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await httpClient(`/api/v1/members/access-invitations/${current.invitationId}/resend`, { method: 'POST' }, token);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'No se pudo renovar la invitación. Espera un minuto antes de reintentar.');
      setCurrent(result);
      setStatus(result.emailDeliveryStatus);
      setCopied(false);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MemberDialog
      title="Acceso del miembro creado"
      subtitle="Cuenta pendiente de activación. El miembro debe crear una contraseña propia."
      onClose={onClose}
    >
      <div className="member-credentials">
        <label>Usuario de acceso · correo registrado</label>
        <code>{current.username}</code>
        <label>Contraseña temporal</label>
        <code>{current.temporaryPassword}</code>
        <p>Se muestra una sola vez. Debe cambiarse antes de consultar información en la app.</p>
        {current.expiresAt && (
          <p>
            Vence: {new Date(current.expiresAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })} (hora de Lima).
          </p>
        )}
        <p role="status">{descriptions[status] || 'Estado del correo sin verificar.'}</p>
        {error && <p role="alert">{error}</p>}
      </div>
      <div className="member-actions">
        {current.invitationId && (
          <>
            <Button variant="secondary" onClick={() => setRefresh((value) => value + 1)}>
              Actualizar envío
            </Button>
            <Button variant="secondary" disabled={busy} onClick={resend}>
              {busy ? 'Renovando…' : 'Reenviar invitación'}
            </Button>
          </>
        )}
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`Usuario: ${current.username}\nContraseña temporal: ${current.temporaryPassword}`);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? 'Copiado' : 'Copiar datos'}
        </Button>
        <Button onClick={onClose}>Aceptar</Button>
      </div>
      <p className="member-hint">
        Reenviar genera una contraseña temporal y un enlace nuevos; los anteriores dejan de servir.
      </p>
    </MemberDialog>
  );
}
