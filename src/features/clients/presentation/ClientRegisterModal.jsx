import React, { useState } from 'react';
import { isAdult, calculateAge } from '../domain/client';
import { registerClientApi } from '../infrastructure/clientApi';

export default function ClientRegisterModal({ token, onClose, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [birthDate, setBirthDate] = useState('2000-01-15');
  const [phone, setPhone] = useState('+51987654321');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const age = calculateAge(birthDate);
  const isEligible = isAdult(birthDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Nombres y apellidos son requeridos.');
      return;
    }

    if (!documentNumber.trim()) {
      setErrorMsg('El número de documento es obligatorio.');
      return;
    }

    if (!isEligible) {
      setErrorMsg('No se puede registrar a un menor de edad. La edad mínima requerida es 18 años.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        birthDate,
        phone: phone.trim(),
        email: email.trim() || null,
      };

      const created = await registerClientApi(payload, token);
      onSuccess(created);
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el socio.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="register-title">
      <div className="modal-content" style={{ maxWidth: '560px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              HU-01 REGISTRO DE SOCIOS
            </span>
            <h2 id="register-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              Alta de Nuevo Socio
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Los datos personales generarán automáticamente el código de socio único.
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="client-firstname">
                Nombres <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                id="client-firstname"
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Carlos Alberto"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-lastname">
                Apellidos <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                id="client-lastname"
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Gómez Paredes"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-doctype">
                Tipo de Documento <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <select
                id="client-doctype"
                className="form-input"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="DNI">DNI (Nacional)</option>
                <option value="CE">Carné de Extranjería (CE)</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-docnumber">
                Número de Documento <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                id="client-docnumber"
                type="text"
                className="form-input"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="07654321"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-birthdate">
                Fecha de Nacimiento <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                id="client-birthdate"
                type="date"
                className="form-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
              <div style={{ marginTop: '4px', fontSize: '11px' }}>
                {age !== null ? (
                  isEligible ? (
                    <span style={{ color: 'var(--color-success)' }}>✓ Socio mayor de edad ({age} años)</span>
                  ) : (
                    <span style={{ color: 'var(--color-danger)' }}>✕ Menor de edad ({age} años) - Registro no admitido</span>
                  )
                ) : null}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-phone">
                Teléfono de Contacto <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                id="client-phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51987654321"
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="client-email">
                Correo Electrónico <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>(Opcional)</span>
              </label>
              <input
                id="client-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="socio@ejemplo.com"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
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
              disabled={submitting || !isEligible}
              style={{ minHeight: '42px' }}
            >
              {submitting ? 'Registrando en servidor...' : 'Registrar Socio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
