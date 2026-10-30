// ==============================================================================
// GYM VIP — Pantalla de Sesión Bloqueada (Inactividad o Expiración)
// Solicita revalidación de contraseña contra el backend para la cuenta conocida
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { Icon } from '../common/Icons';
import athleteImg from '../../assets/hero-athlete.jpg';

export default function LockScreenModal() {
  const { lockedAccount, lockReason, unlockSession, switchAccount, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);

  const emailDisplay = lockedAccount?.email || 'colaborador@vipcenterfit.pe';
  const roleDisplay = lockedAccount?.roles?.join(', ') || 'COLABORADOR';
  const initial = emailDisplay.charAt(0).toUpperCase();

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor, ingrese su contraseña para continuar.');
      return;
    }

    setError(null);
    try {
      await unlockSession(password);
    } catch {
      setError('Contraseña incorrecta o cuenta temporalmente inhabilitada.');
    }
  };

  return (
    <div
      className="login-fullscreen-wrapper lock-screen-wrapper"
      style={{ backgroundImage: `url(${athleteImg})` }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
    >
      <div className="login-backdrop-overlay" />

      <div className="login-centered-card lock-screen-card">
        {/* Encabezado de Sesión en Pausa */}
        <div className="lock-screen-header">
          <div className="lock-screen-badge-icon" aria-hidden="true">
            <Icon name="shield-check" size={28} color="var(--color-gold)" />
          </div>
          <h1 id="lock-title" className="lock-screen-title">Sesión en Pausa</h1>
          <p className="lock-screen-reason">
            {lockReason === 'expired'
              ? 'Su sesión anterior ha caducado por seguridad. Revalide su clave para reanudar el trabajo.'
              : 'La pantalla fue bloqueada automáticamente tras un período de inactividad operativa.'}
          </p>
        </div>

        {/* Identidad Segura del Usuario Bloqueado */}
        <div className="lock-account-box">
          <div className="lock-account-avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="lock-account-info">
            <span className="lock-account-email" title={emailDisplay}>
              {emailDisplay}
            </span>
            <div className="lock-account-role-badge">
              <span className="badge badge-gold" style={{ fontSize: '11px', padding: '2px 8px' }}>
                {roleDisplay}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <Alert
            variant="danger"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Formulario de Revalidación de Contraseña */}
        {!showPasswordField ? (
          <div className="lock-actions-initial">
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowPasswordField(true)}
              style={{ width: '100%', minHeight: '46px', fontSize: '15px' }}
            >
              Desbloquear Sesión
            </Button>

            <button
              type="button"
              className="lock-switch-account-btn"
              onClick={switchAccount}
              style={{ marginTop: '16px' }}
            >
              Iniciar sesión con otra cuenta
            </button>
          </div>
        ) : (
          <form onSubmit={handleUnlockSubmit} className="lock-unlock-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="lock-password">
                Ingrese su contraseña para desbloquear
              </label>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <Icon name="shield-check" size={16} color="var(--color-gold)" />
                </span>
                <input
                  id="lock-password"
                  type="password"
                  className="form-input with-left-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '20px', minHeight: '46px', fontSize: '15px' }}
            >
              {loading ? 'Revalidando credenciales...' : 'Confirmar y Desbloquear'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="lock-switch-account-btn"
                onClick={switchAccount}
              >
                Cambiar de cuenta / Cerrar sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

