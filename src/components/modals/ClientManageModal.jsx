// ==============================================================================
// GYM VIP — Modal: ClientManageModal (Ficha, Edición Concurrente y Auditoría HU-02)
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getClientByIdApi } from '../../api/clientApi';
import { updateClient, clientChanges, verifyCoverage } from '../../api/jorgeApi';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { Badge } from '../common/Badge';
import { Icon } from '../common/Icons';
import CoverageCard from '../common/CoverageCard';

const labels = {
  firstName: 'Nombres',
  lastName: 'Apellidos',
  countryCode: 'País del documento',
  documentType: 'Tipo de documento',
  documentNumber: 'Número de documento',
  phone: 'Celular',
  email: 'Correo electrónico',
};

function initialForm(client) {
  const doc = client.documents?.find((d) => d.isPrimary) || client.documents?.[0] || {};
  return {
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    countryCode: doc.countryCode || 'PE',
    documentType: doc.documentType || 'DNI',
    documentNumber: doc.documentNumber || '',
    phone: client.phone || '',
    email: client.email || '',
    version: client.version,
  };
}

export default function ClientManageModal({ client, onClose, onUpdated }) {
  const { token, isAdmin } = useAuth();
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [coverage, setCoverage] = useState(null);
  const [coverageError, setCoverageError] = useState('');
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [reload, setReload] = useState(0);
  const dialog = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const root = dialog.current;
    root?.querySelector('button')?.focus();

    function keys(event) {
      if (event.key === 'Escape' && !busy && (!editing || window.confirm('¿Desea cerrar sin guardar los cambios?'))) {
        onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = [...root.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    root?.addEventListener('keydown', keys);
    return () => {
      root?.removeEventListener('keydown', keys);
      previous?.focus();
    };
  }, [busy, editing, onClose]);

  useEffect(() => {
    let active = true;
    setDetail(null);
    setError('');
    getClientByIdApi(client.id, token)
      .then((value) => {
        if (active) {
          setDetail(value);
          setForm(initialForm(value));
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [client.id, token, reload]);

  useEffect(() => {
    let active = true;
    setCoverage(null);
    setCoverageError('');
    verifyCoverage(client.id, token)
      .then((value) => active && setCoverage(value))
      .catch((e) => active && setCoverageError(e.message));
    return () => {
      active = false;
    };
  }, [client.id, token, reload]);

  useEffect(() => {
    if (!isAdmin()) return;
    let active = true;
    setHistory(null);
    setHistoryError('');
    clientChanges(client.id, historyPage, token)
      .then((value) => active && setHistory(value))
      .catch((e) => active && setHistoryError(e.message));
    return () => {
      active = false;
    };
  }, [client.id, token, historyPage, reload]);

  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const value = await updateClient(
        client.id,
        { ...form, email: form.email.trim() || null, phone: form.phone.trim() || null },
        token
      );
      setDetail(value);
      setForm(initialForm(value));
      setEditing(false);
      setSuccess('Datos del socio actualizados correctamente en base de datos.');
      setReload((n) => n + 1);
      onUpdated?.(value);
    } catch (e) {
      setError(`${e.message}${e.details?.length ? ' ' + e.details.map((d) => d.message).join(' ') : ''}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={dialog} className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="modal-content" style={{ maxWidth: '880px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Badge variant="gold">FICHA OFICIAL DE SOCIO</Badge>
              {detail && <span style={{ fontSize: '12px', color: 'var(--color-gold)', fontFamily: 'monospace', fontWeight: 700 }}>{detail.memberCode}</span>}
            </div>
            <h2 id="detail-title" style={{ fontSize: '24px', fontWeight: 800, margin: '2px 0', color: 'var(--color-text-primary)' }}>
              {detail ? detail.fullName : 'Cargando información del socio…'}
            </h2>
            {detail && (
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Fecha de alta: {new Date(detail.createdAt).toLocaleDateString('es-PE')} · Versión de ficha: v{detail.version}
              </span>
            )}
          </div>

          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cerrar Ficha
          </Button>
        </div>

        {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
        {success && <Alert variant="success" message={success} onClose={() => setSuccess('')} />}

        {!detail && !error && (
          <div style={{ textAlign: 'center', padding: '32px' }} role="status">
            <p style={{ color: 'var(--color-gold)' }}>Cargando expediente de cliente…</p>
          </div>
        )}

        {!detail && error && (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Button variant="secondary" onClick={() => setReload((n) => n + 1)}>
              Reintentar Carga
            </Button>
          </div>
        )}

        {detail && (
          <>
            {/* Sección 1: Datos Personales y Edición */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Datos de Contacto e Identidad
                </h3>
                {!editing && (
                  <Button variant="primary" style={{ fontSize: '12px', minHeight: '34px' }} onClick={() => { setEditing(true); setSuccess(''); }}>
                    <Icon name="edit" size={14} />
                    <span>Modificar Datos</span>
                  </Button>
                )}
              </div>

              {editing ? (
                <form onSubmit={save} style={{ background: 'var(--color-surface-input)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gold-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    {Object.entries(labels).map(([name, label]) => (
                      <div key={name}>
                        <label className="form-label" htmlFor={`edit-${name}`}>
                          {label} {['email', 'phone'].includes(name) ? '(Opcional)' : ''}
                        </label>
                        <input
                          id={`edit-${name}`}
                          className="form-input"
                          name={name}
                          type={name === 'email' ? 'email' : 'text'}
                          required={!['email', 'phone'].includes(name)}
                          value={form[name] || ''}
                          disabled={busy}
                          maxLength={
                            ['firstName', 'lastName'].includes(name)
                              ? 100
                              : name === 'email'
                              ? 150
                              : name === 'countryCode'
                              ? 10
                              : name === 'documentType'
                              ? 30
                              : name === 'phone'
                              ? 20
                              : 50
                          }
                          onChange={(e) => setForm((previous) => ({ ...previous, [name]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '18px' }}>
                    ℹ️ Si otra persona modificó la ficha simultáneamente, tus cambios se conservarán en este formulario para revisión (Control Concurrente HTTP 409).
                  </p>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        setForm(initialForm(detail));
                        setEditing(false);
                        setError('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm('Recargar reemplazará lo escrito por la versión actual del servidor.')) {
                          setEditing(false);
                          setReload((n) => n + 1);
                        }
                      }}
                    >
                      Recargar Servidor
                    </Button>
                    <Button type="submit" variant="primary" disabled={busy}>
                      <Icon name="check-circle" size={15} />
                      <span>{busy ? 'Guardando…' : 'Guardar Cambios'}</span>
                    </Button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'var(--color-surface-input)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  {Object.entries(labels).map(([name, label]) => (
                    <div key={name}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>{label}</span>
                      <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{initialForm(detail)[name] || '—'}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sección 2: Cobertura Actual */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>
                Vigencia de Membresía Actual
              </h3>
              {coverageError ? (
                <Alert variant="danger" message={`No se pudo verificar la membresía: ${coverageError}`} />
              ) : coverage ? (
                <CoverageCard value={coverage} />
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Consultando vigencia autoritativa…</p>
              )}
            </div>

            {/* Sección 3: Historial de Cambios / Auditoría (Exclusivo ADMIN) */}
            {isAdmin() && (
              <div style={{ marginTop: '28px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    Libro de Auditoría de Cambios
                  </h3>
                  <Badge variant="gold" style={{ fontSize: '11px' }}>Exclusivo ADMIN</Badge>
                </div>

                {historyError && <Alert variant="danger" message={historyError} />}
                {!history && !historyError && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Cargando registros de auditoría…</p>
                )}

                {history && (
                  <>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                      {history.totalElements ? `${history.totalElements} modificaciones de campos registradas` : 'No hay cambios de datos registrados para este socio.'}
                    </p>

                    {history.content.length > 0 && (
                      <div className="table-responsive" style={{ overflowX: 'auto', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Fecha (Lima)</th>
                              <th>Autor</th>
                              <th>Campo</th>
                              <th>Valor Previo</th>
                              <th>Nuevo Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.content.map((row, i) => (
                              <tr key={`${row.changeId}-${i}`}>
                                <td style={{ fontSize: '12px' }}>
                                  {new Date(`${row.changedAtUtc}Z`).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
                                </td>
                                <td><strong style={{ fontSize: '12px' }}>{row.actor}</strong></td>
                                <td><Badge variant="neutral">{labels[row.field] || row.field}</Badge></td>
                                <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{row.before || '—'}</td>
                                <td style={{ fontSize: '12px', color: 'var(--color-gold)', fontWeight: 600 }}>{row.after || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {history.totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
                        <Button variant="secondary" disabled={historyPage === 0} onClick={() => setHistoryPage((n) => n - 1)}>
                          Anterior
                        </Button>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          Página {historyPage + 1} de {history.totalPages}
                        </span>
                        <Button variant="secondary" disabled={history.last} onClick={() => setHistoryPage((n) => n + 1)}>
                          Siguiente
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
