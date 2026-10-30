// ==============================================================================
// GYM VIP — Modal de Alta de Clientes / Socios (HU-01)
// ==============================================================================

import React, { useState } from 'react';
import { isAdult, calculateAge } from '../../utils/dateUtils';
import { registerNewClient } from '../../services/clientService';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';

export default function ClientRegisterModal({ token, onClose, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const age = birthDate ? calculateAge(birthDate) : null;
  const isEligible = birthDate ? isAdult(birthDate) : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    setSubmitting(true);
    try {
      const payload = {
        firstName,
        lastName,
        documentType,
        documentNumber,
        birthDate,
        phone,
        email,
      };

      const created = await registerNewClient(payload, token);
      onSuccess(created);
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el socio.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="client-modal-title">
      <div className="modal-content" style={{ maxWidth: '580px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              REGISTRO DE SOCIO VIP
            </span>
            <h2 id="client-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              Alta de Nuevo Socio
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              El sistema generará automáticamente un código determinista oficial (ej. MAR-XXXXXX).
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Cerrar formulario"
            style={{ minHeight: '36px', minWidth: '36px', padding: '6px' }}
          >
            ✕
          </button>
        </div>

        {errorMsg && <Alert variant="danger" message={errorMsg} onClose={() => setErrorMsg(null)} />}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="client-first-name">
                Nombres *
              </label>
              <input
                id="client-first-name"
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. Mariana"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-last-name">
                Apellidos *
              </label>
              <input
                id="client-last-name"
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Torres Ramos"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="client-doc-type">
                Tipo Doc. *
              </label>
              <select
                id="client-doc-type"
                className="form-input"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="DNI">DNI</option>
                <option value="CE">C.E.</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-doc-number">
                Número de Documento *
              </label>
              <input
                id="client-doc-number"
                type="text"
                className="form-input"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="72819201"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="client-birth-date">
                  Fecha de Nacimiento *
                </label>
                {age !== null && (
                  <span
                    className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`}
                    style={{ fontSize: '10px' }}
                  >
                    {age} años {isEligible ? '(Mayor)' : '(Menor)'}
                  </span>
                )}
              </div>
              <input
                id="client-birth-date"
                type="date"
                className="form-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
              {birthDate && !isEligible && (
                <span style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>
                  Solo socios mayores de 18 años permitidos en esta base.
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-phone">
                Teléfono de Contacto (Opcional)
              </label>
              <input
                id="client-phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51987654321"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="client-email">
                Correo Electrónico (Opcional)
              </label>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                No obligatorio en recepción
              </span>
            </div>
            <input
              id="client-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@ejemplo.pe"
            />
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
              disabled={submitting || !isEligible}
            >
              {submitting ? 'Registrando Socio...' : 'Completar Registro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
