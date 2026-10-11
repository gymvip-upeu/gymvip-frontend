import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-brand-700)' }}>GYM VIP</span>
            <span className="badge badge-brand">PRO</span>
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Iniciar Sesión</h2>
          <p style={{ color: 'var(--color-ink-600)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            Acceso administrativo y recepción (HU-03)
          </p>
        </div>

        {error && <div className="alert alert-danger">✕ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Institucional</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-ink-600)', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>
            ACCESO RÁPIDO PARA PRUEBAS (HU-03 & HU-04)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', minHeight: '34px', justifyContent: 'flex-start' }}
              onClick={() => handleQuickLogin('admin@vipcenterfit.pe', 'Admin123!')}
            >
              👑 Administrador (crear y editar planes)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', minHeight: '34px', justifyContent: 'flex-start' }}
              onClick={() => handleQuickLogin('recepcion@vipcenterfit.pe', 'Recepcion123!')}
            >
              👤 Recepción (permiso mínimo / consulta)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
