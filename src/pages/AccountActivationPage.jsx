import React, { useEffect, useState } from 'react';
import { config } from '../config/environment';
import './AccountActivationPage.css';

function RecoveryLinkRequest() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!remaining) return undefined;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);
  async function request(event) {
    event.preventDefault();
    if (busy || remaining) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) throw new Error('No se pudo solicitar el enlace. Reintenta en unos minutos.');
      setMessage('Si el correo corresponde a una cuenta activa, recibirás un nuevo enlace. Revisa también Spam.');
      setRemaining(60);
    } catch (failure) {
      setMessage(failure.message || 'No se pudo conectar. Intenta nuevamente.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={request}>
      <h2>Solicitar otro enlace</h2>
      <label>
        Correo registrado
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={busy} />
      </label>
      <button type="submit" disabled={busy || remaining > 0}>
        {busy ? 'Enviando…' : remaining ? `Reenviar en ${remaining}s` : 'Enviar nuevo enlace'}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

export default function AccountActivationPage({ recovery = false }) {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [invalidToken, setInvalidToken] = useState(false);
  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname);
    document.title = `${recovery ? 'Restablecer contraseña' : 'Activa tu cuenta'} · VIP CENTER FIT`;
  }, [recovery]);
  async function submit(event) {
    event.preventDefault();
    if (busy || done) return;
    if (password !== confirmation) {
      setError('Las contraseñas deben coincidir.');
      return;
    }
    if (password.length < 12 || new window.TextEncoder().encode(password).length > 72 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Usa al menos 12 caracteres, mayúsculas, minúsculas y números (máximo 72 bytes).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/auth/${recovery ? 'password-reset/confirm' : 'activate'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          setInvalidToken(true);
          throw new Error('Este enlace venció o ya fue utilizado. Solicita uno nuevo.');
        }
        throw new Error(result.message || 'No se pudo guardar la contraseña. Intenta nuevamente.');
      }
      setPassword('');
      setConfirmation('');
      setDone(true);
    } catch (failure) {
      setError(failure.message || 'No se pudo conectar. Reintenta cuando vuelva la conexión.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="account-activation">
      <section className="account-activation-card">
        <p className="account-activation-brand">VIP CENTER FIT</p>
        <p className="account-activation-eyebrow">SEGURIDAD DE TU CUENTA</p>
        <h1>{done ? 'Tu contraseña está lista' : recovery ? 'Restablece tu contraseña' : 'Crea tu nueva contraseña'}</h1>
        {done ? (
          <>
            <p>Tu contraseña anterior y este enlace dejaron de ser válidos. Abre la app e ingresa con tu correo y tu nueva contraseña.</p>
            <p className="account-activation-success" role="status">Cambio confirmado. Ya puedes iniciar sesión.</p>
          </>
        ) : !token || invalidToken ? (
          <p role="alert">
            {recovery
              ? 'El enlace falta, venció o ya fue utilizado. Puedes solicitar uno nuevo abajo.'
              : 'Abre el enlace original de tu correo para continuar. Si venció, solicita una nueva invitación a Recepción.'}
          </p>
        ) : (
          <>
            <p>{recovery ? 'Elige una contraseña propia para recuperar el acceso.' : 'Activa tu acceso al gimnasio con una contraseña que solo tú conozcas.'}</p>
            <form onSubmit={submit}>
              <label>
                Nueva contraseña
                <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} required />
              </label>
              <label>
                Confirmar nueva contraseña
                <input type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={busy} required />
              </label>
              <p className="account-activation-hint">Al menos 12 caracteres, con mayúsculas, minúsculas y números. Debe ser diferente de la anterior.</p>
              {error && <p className="account-activation-error" role="alert">{error}</p>}
              <button type="submit" disabled={busy}>
                {busy ? 'Guardando…' : recovery ? 'Guardar nueva contraseña' : 'Activar mi cuenta'}
              </button>
            </form>
          </>
        )}
        {recovery && !done && (!token || invalidToken) && <RecoveryLinkRequest />}
        <footer>Tu nueva contraseña no se enviará por correo.</footer>
      </section>
    </main>
  );
}
