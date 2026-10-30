// ==============================================================================
// GYM VIP — Pantalla de Acceso al Sistema (Login Luxury Split)
// Diseño Premium Dark & Gold inspirado en Figma con fondo fotográfico oficial
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { Icon } from '../common/Icons';
import athleteImg from '../../assets/hero-athlete.jpg';

export default function LoginModal() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@vipcenterfit.pe');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Error de autenticación. Verifique sus credenciales.');
    }
  };

  const handleQuickLogin = async (presetEmail, presetPassword) => {
    setEmail(presetEmail);
    setPassword(presetPassword);
    setError(null);
    try {
      await login(presetEmail, presetPassword);
    } catch (err) {
      setError(err.message || 'Error de autenticación.');
    }
  };

  return (
    <div className="login-screen-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="login-split-card">
        {/* Panel Izquierdo: Fotografía Hero Luxury Fitness */}
        <div className="login-hero-panel" style={{ backgroundImage: `url(${athleteImg})` }}>
          <div className="login-hero-overlay">
            <div className="login-hero-brand">
              <span className="login-hero-crown" aria-hidden="true">
                <Icon name="crown" size={32} color="var(--color-gold)" />
              </span>
              <div>
                <h2 className="login-hero-logo">GYM VIP</h2>
                <span className="login-hero-tagline">LUXURY FITNESS CLUB</span>
              </div>
            </div>

            <div className="login-hero-content">
              <span className="badge badge-gold" style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
                EXCLUSIVIDAD Y RENDIMIENTO
              </span>
              <p className="login-hero-text">
                Gestión integral de socios, membresías y control de acceso con los más altos estándares de seguridad y auditoría.
              </p>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Formulario de Acceso */}
        <div className="login-form-panel">
          <div className="login-header">
            <span className="header-subtitle">PORTAL OPERATIVO</span>
            <h1 id="login-title" className="login-title">Acceso al Sistema</h1>
            <p className="login-subtitle">
              Ingrese con sus credenciales de colaborador autorizadas.
            </p>
          </div>

          {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Correo Institucional
              </label>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <Icon name="user" size={16} color="var(--color-text-muted)" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="form-input with-left-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vipcenterfit.pe"
                  required
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
                  <Icon name="shield-check" size={16} color="var(--color-text-muted)" />
                </span>
                <input
                  id="login-password"
                  type="password"
                  className="form-input with-left-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '24px', minHeight: '46px', fontSize: '15px' }}
            >
              {loading ? 'Validando credenciales...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Accesos Rápidos para Evaluación y Demo */}
          <div className="login-demo-section">
            <span className="login-demo-title">Accesos Rápidos de Demostración</span>
            <div className="login-demo-buttons">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('admin@vipcenterfit.pe', 'Admin123!')}
                disabled={loading}
                title="Iniciar sesión como Administrador"
              >
                <Icon name="shield-check" size={14} color="var(--color-gold)" />
                <span>Demo ADMIN</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('recepcion@vipcenterfit.pe', 'Recepcion123!')}
                disabled={loading}
                title="Iniciar sesión como Recepcionista"
              >
                <Icon name="users" size={14} color="var(--color-text-secondary)" />
                <span>Demo RECEPCIÓN</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
