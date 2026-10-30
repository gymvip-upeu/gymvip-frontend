// ==============================================================================
// GYM VIP — Pantalla de Acceso al Sistema (Login Centrado Sobrio)
// Tarjeta centrada sobre fondo del atleta con estética luxury dark & gold
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { Icon } from '../common/Icons';
import athleteImg from '../../assets/hero-athlete.jpg';

export default function LoginModal() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch {
      // Mensaje neutro y seguro: no expone si el correo existe o no
      setError('Credenciales de acceso incorrectas o cuenta inhabilitada.');
    }
  };

  return (
    <div
      className="login-fullscreen-wrapper"
      style={{ backgroundImage: `url(${athleteImg})` }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div className="login-backdrop-overlay" />

      <div className="login-centered-card">
        {/* Encabezado Institucional con Logo Sobrio */}
        <div className="login-brand-header">
          <div className="login-brand-logo-mark" aria-hidden="true">
            <span className="login-brand-monogram">VIP</span>
          </div>
          <h1 id="login-title" className="login-brand-title">GYM VIP</h1>
          <p className="login-brand-tagline">CENTRO DE ENTRENAMIENTO EXCLUSIVO</p>
          <div className="login-header-divider" />
        </div>

        <div className="login-card-intro">
          <h2 className="login-section-title">Portal Operativo</h2>
          <p className="login-section-desc">
            Ingrese sus credenciales autorizadas de colaborador para acceder a la administración.
          </p>
        </div>

        {error && (
          <Alert
            variant="danger"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Formulario de Acceso Directo */}
        <form onSubmit={handleSubmit} className="login-clean-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Correo Institucional
            </label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <Icon name="user" size={16} color="var(--color-gold)" />
              </span>
              <input
                id="login-email"
                type="email"
                className="form-input with-left-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@vipcenterfit.pe"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="login-password">
              Contraseña
            </label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <Icon name="shield-check" size={16} color="var(--color-gold)" />
              </span>
              <input
                id="login-password"
                type="password"
                className="form-input with-left-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="login-submit-button"
            style={{ width: '100%', marginTop: '24px', minHeight: '46px', fontSize: '15px' }}
          >
            {loading ? 'Validando credenciales...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Nota Institucional de Seguridad */}
        <div className="login-footer-notice">
          <span className="security-bullet" aria-hidden="true">•</span>
          <span>Acceso restringido a colaboradores auditados. Sesión protegida por política de aislamiento.</span>
        </div>
      </div>
    </div>
  );
}
