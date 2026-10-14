import React, { useState } from 'react';
import { STAFF_ROLES, validateStaffCreation } from '../domain/staff';
import { createAccountApi } from '../infrastructure/staffApi';

export default function StaffModal({ token, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('RECEPCION');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationErrors = validateStaffCreation(email, password, role);
    if (validationErrors.length > 0) {
      setErrorMsg(validationErrors.join(' '));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: email.trim(),
        password,
        roles: [role],
      };

      const result = await createAccountApi(payload, token);
      onSuccess(result);
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear la cuenta de personal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="staff-modal-title">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              HU-04 PERSONAL Y ROLES
            </span>
            <h2 id="staff-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              Alta de Personal
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              La contraseña se almacenará de manera segura con hash BCrypt.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{ minHeight: '36px', minWidth: '36px', padding: '6px' }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '16px' }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="staff-email">
              Correo Institucional <span style={{ color: 'var(--color-gold)' }}>*</span>
            </label>
            <input
              id="staff-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@vipcenterfit.pe"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="staff-password">
              Contraseña Temporal <span style={{ color: 'var(--color-gold)' }}>*</span>
            </label>
            <input
              id="staff-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={6}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
              Mínimo 6 caracteres
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="staff-role">
              Rol Operativo <span style={{ color: 'var(--color-gold)' }}>*</span>
            </label>
            <select
              id="staff-role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ minHeight: '42px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minHeight: '42px' }}
            >
              {submitting ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
