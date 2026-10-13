import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/apiClient';

export default function ClientsView() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal Alta Cliente
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('1998-04-12');
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [phone, setPhone] = useState('+51987654321');
  const [email, setEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [marketingWhatsApp, setMarketingWhatsApp] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Minor detection
  const isMinor = () => {
    if (!birthDate) return false;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age < 18;
  };

  const fetchClients = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = query ? `/api/v1/clients?query=${encodeURIComponent(query)}` : '/api/v1/clients';
      const res = await apiFetch(url, {}, token);
      if (!res.ok) throw new Error('Error al consultar socios');
      const data = await res.json();
      setClients(data.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClients(searchQuery);
  };

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (isMinor()) {
      setFormError('⚠️ Bloqueado: El registro de menores de edad requiere representante legal validado (en espera de políticas).');
      return;
    }

    if (!termsAccepted) {
      setFormError('Debe aceptar los Términos del Servicio para continuar.');
      return;
    }
    if (!privacyAccepted) {
      setFormError('Debe acusar recibo y lectura del Aviso de Privacidad.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(
        '/api/v1/clients',
        {
          method: 'POST',
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            birthDate,
            countryCode: 'PE',
            documentType: docType,
            documentNumber: docNumber.trim(),
            phone: phone.trim(),
            email: email.trim(),
            termsAccepted,
            privacyAccepted,
            marketingEmailAccepted: marketingEmail,
            marketingWhatsAppAccepted: marketingWhatsApp,
          }),
        },
        token
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al registrar el socio');
      }

      setIsRegisterOpen(false);
      setSuccessMsg('Socio registrado exitosamente con evidencia versionada.');
      setTimeout(() => setSuccessMsg(null), 4000);
      setDocNumber('');
      setFirstName('');
      setLastName('');
      fetchClients();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Gestión de Socios (HU-01, HU-02)</h1>
          <p style={{ color: 'var(--color-ink-600)', fontSize: 'var(--font-size-sm)' }}>
            Registro de socios adultos con consentimiento legal y búsqueda rápida en mostrador.
          </p>
        </div>

        <button onClick={() => { setFormError(null); setIsRegisterOpen(true); }} className="btn btn-primary">
          + Registrar Socio Adulto
        </button>
      </div>

      {successMsg && <div className="alert alert-success">✓ {successMsg}</div>}
      {error && <div className="alert alert-danger">✕ {error}</div>}

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '400px' }}
          placeholder="Buscar por nombre, apellido o DNI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">
          Buscar
        </button>
        {searchQuery && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setSearchQuery(''); fetchClients(''); }}
          >
            Limpiar
          </button>
        )}
      </form>

      {/* Loading */}
      {loading && (
        <div className="state-loading">
          <div className="spinner"></div>
          <p>Cargando lista de socios...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && clients.length === 0 && (
        <div className="card state-empty">
          <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>No se encontraron socios</p>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
            {searchQuery ? 'Pruebe con otro término de búsqueda o registre un nuevo cliente.' : 'No hay socios registrados todavía.'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && clients.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombres y Apellidos</th>
                <th>Documento</th>
                <th>Fecha Nacimiento</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const doc = c.documents && c.documents[0];
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</td>
                    <td>
                      {doc ? (
                        <span className="badge badge-brand">
                          {doc.documentType} {doc.documentNumber}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{c.birthDate}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>
                      <span className={`badge ${c.status === 'ACTIVO' ? 'badge-success' : 'badge-neutral'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Alta de Cliente Adulto (HU-01) */}
      {isRegisterOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: '6px' }}>
              Nuevo Registro de Socio Adulto (HU-01)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-600)', marginBottom: '16px' }}>
              Los datos se validan contra duplicados de documento. Los consentimientos se archivan de forma inmutable.
            </p>

            {formError && <div className="alert alert-danger">{formError}</div>}
            {isMinor() && (
              <div className="alert alert-warning">
                ⚠️ Advertencia: La fecha seleccionada corresponde a un menor de 18 años. El alta de menores se encuentra bloqueada hasta definir las políticas de representación con el cliente.
              </div>
            )}

            <form onSubmit={handleRegisterClient}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Nombres *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Juan Carlos"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Quispe Rojas"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo Documento *</label>
                  <select
                    className="form-select"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    <option value="DNI">DNI (Perú)</option>
                    <option value="CARNET_EXTRANJERIA">Carné de Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Número de Documento *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Ej. 72819201"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Nacimiento (Mayor de 18 años) *</label>
                <input
                  type="date"
                  className="form-input"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Celular</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987654321"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="socio@ejemplo.pe"
                  />
                </div>
              </div>

              {/* Casillas de Consentimiento Separadas */}
              <div style={{ background: 'var(--color-surface-50)', padding: '16px', borderRadius: 'var(--radius-md)', margin: '16px 0', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-brand-700)' }}>
                  Consentimientos y Protección de Datos (Ley N° 29733)
                </div>

                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                  />
                  <span className="form-checkbox-label">
                    <strong>Acepto los Términos del Servicio (v1.0)</strong> * Requerido para la contratación del servicio.
                  </span>
                </label>

                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    required
                  />
                  <span className="form-checkbox-label">
                    <strong>He leído el Aviso de Privacidad y Tratamiento de Datos (v1.0)</strong> * Requerido para el registro de la ficha.
                  </span>
                </label>

                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={marketingEmail}
                    onChange={(e) => setMarketingEmail(e.target.checked)}
                  />
                  <span className="form-checkbox-label">
                    (Opcional) Acepto recibir promociones y avisos comerciales por correo electrónico.
                  </span>
                </label>

                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={marketingWhatsApp}
                    onChange={(e) => setMarketingWhatsApp(e.target.checked)}
                  />
                  <span className="form-checkbox-label">
                    (Opcional) Acepto recibir promociones y recordatorios personalizados por WhatsApp.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRegisterOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || isMinor() || !termsAccepted || !privacyAccepted}
                >
                  {submitting ? 'Registrando...' : 'Registrar Socio Adulto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
