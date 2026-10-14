import React, { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';

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
      setError(err.message || 'Error de autenticación');
    }
  };

  const handleQuickLogin = async (presetEmail, presetPassword) => {
    setEmail(presetEmail);
    setPassword(presetPassword);
    setError(null);
    try {
      await login(presetEmail, presetPassword);
    } catch (err) {
      setError(err.message || 'Error de autenticación');
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-gold)', letterSpacing: '1px' }}>
              GYM VIP
            </span>
            <span className="badge badge-gold" style={{ fontSize: '11px', padding: '3px 8px' }}>
              LUXURY PRO
            </span>
          </div>
          <h1 id="login-title" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '4px 0' }}>
            Acceso al Sistema
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Plataforma operativa · Base Funcional Sprint 1
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px' }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Correo Institucional
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vipcenterfit.pe"
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '24px', minHeight: '44px', fontSize: '15px' }}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar a la Plataforma'}
          </button>
        </form>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px', textAlign: 'center' }}>
            Accesos rápidos para evaluación:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin('admin@vipcenterfit.pe', 'Admin123!')}
              style={{ fontSize: '12px', minHeight: '36px' }}
              title="Cuenta con rol ADMIN: Gestión de Clientes, Planes y Personal (HU-01, HU-04, HU-06)"
            >
              👑 Admin Demo
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin('recepcion@vipcenterfit.pe', 'Recepcion123!')}
              style={{ fontSize: '12px', minHeight: '36px' }}
              title="Cuenta con rol RECEPCION: Registro de Clientes y Consulta de Planes (HU-01, HU-06)"
            >
              📋 Recepción Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
