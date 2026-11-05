// ==============================================================================
// GYM VIP — Modal de Alta de Clientes / Socios y Acceso Móvil
// ==============================================================================

import React, { useState } from 'react';
import { isAdult, calculateAge } from '../../utils/dateUtils';
import { registerMember } from '../../api/memberApi';
import { validateClientRegistration } from '../../validators/clientValidator';
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
  const [notes, setNotes] = useState('');
  const [createAccess, setCreateAccess] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const age = birthDate ? calculateAge(birthDate) : null;
  const isEligible = birthDate ? isAdult(birthDate) : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      documentType,
      documentNumber,
      notes,
      createAccess,
    };

    if (typeof validateClientRegistration === 'function') {
      const errors = validateClientRegistration(formData);
      if (errors && errors.length > 0) {
        setErrorMsg(errors.join(' '));
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        client: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          documentType,
          documentNumber: documentNumber.trim(),
          birthDate,
          phone: phone ? phone.trim() : null,
          email: email ? email.trim().toLowerCase() : null,
          countryCode: 'PE',
        },
        notes: notes ? notes.trim() : null,
        createAccess,
      };

      const result = await registerMember(payload, token);
      if (!result?.client?.id) {
        throw new Error('No se pudo confirmar el registro completo. Consulte el listado antes de reintentar.');
      }

      onSuccess(result.client, result.credentials);
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el miembro.');
    } finally {
      setSubmitting(false);
    }
  };

  // Soporte de tecla Escape para cerrar modal
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);
  return (
    <div
      className="modal-overlay client-register-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
      style={{
        backgroundColor: 'rgba(11, 13, 18, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        className="modal-content client-register-modal-content"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: 'min(90vh, 780px)',
          overflowY: 'auto',
          padding: '32px',
          background: 'var(--color-surface-panel, #12141A)',
          border: '1px solid var(--color-gold-border, rgba(212, 175, 55, 0.35))',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(212, 175, 55, 0.15)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '6px' }}>
              REGISTRO DE MIEMBRO VIP
            </span>
            <h2 id="client-modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: '2px 0' }}>
              Alta de Nuevo Miembro
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
                maxLength={100}
                required
                autoFocus
                disabled={submitting}
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
                maxLength={100}
                required
                disabled={submitting}
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
                disabled={submitting}
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
                maxLength={50}
                required
                disabled={submitting}
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
                disabled={submitting}
              />
              {birthDate && !isEligible && (
                <span style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>
                  Solo miembros mayores de 18 años permitidos en esta base.
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
                maxLength={20}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="client-email">
                Correo Electrónico (Opcional)
              </label>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Requerido para acceso a la app móvil
              </span>
            </div>
            <input
              id="client-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@ejemplo.pe"
              maxLength={150}
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" htmlFor="client-notes">
              Notas y Preferencias (Opcional)
            </label>
            <textarea
              id="client-notes"
              className="form-input"
              rows={2}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones de entrenamiento, condiciones médicas o preferencias..."
              disabled={submitting}
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="client-create-access"
              type="checkbox"
              checked={createAccess}
              onChange={(e) => setCreateAccess(e.target.checked)}
              disabled={submitting}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)' }}
            />
            <label htmlFor="client-create-access" style={{ fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
              Generar credenciales de acceso a la app móvil con contraseña temporal
            </label>
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
              disabled={submitting || (birthDate && !isEligible)}
            >
              {submitting ? 'Registrando Miembro...' : 'Completar Registro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
