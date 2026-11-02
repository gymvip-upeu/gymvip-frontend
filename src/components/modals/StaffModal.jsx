// ==============================================================================
// GYM VIP — Modal de Alta de Personal (HU-04)
// ==============================================================================

import React, { useState } from 'react';
import { STAFF_ROLES } from '../../validators/staffValidator';
import { createStaffAccount } from '../../services/staffService';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';

export default function StaffModal({ token, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('RECEPCION');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    setSubmitting(true);
    try {
      const payload = {
        email,
        password,
        role,
      };

      const result = await createStaffAccount(payload, token);
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
              ALTA DE COLABORADOR
            </span>
            <h2 id="staff-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              Alta de Personal
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              La contraseña se almacenará de manera segura con hash BCrypt en el backend.
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

        {errorMsg && <Alert variant="danger" message={errorMsg} onClose={() => setErrorMsg(null)} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="staff-email">
              Correo Institucional *
            </label>
            <input
              id="staff-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@vipcenterfit.pe"
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="staff-password">
              Contraseña Inicial *
            </label>
            <input
              id="staff-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="staff-role">
              Rol Operativo *
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? 'Creando Cuenta...' : 'Registrar Colaborador'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
