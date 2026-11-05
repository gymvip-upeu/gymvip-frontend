// ==============================================================================
// GYM VIP — Pantalla: VerificationPage (Control de Ingreso en Mostrador y QR)
// HU-13 T01, T02, T03, T05, T06, T07, T09, T10, T11 — Alcance Web Sprint 1
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchClientsApi } from '../api/clientApi';
import { verifyCoverage } from '../api/jorgeApi';
import { checkInMember, getMemberAttendance } from '../api/memberApi';
import CoverageCard from '../components/common/CoverageCard';
import QrScannerModal from '../components/modals/QrScannerModal';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Icon } from '../components/common/Icons';
import OperationsNav from '../components/common/OperationsNav';

function formatLimaTime(utcString) {
  if (!utcString) return '-';
  try {
    const iso = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return utcString;
  }
}

export default function VerificationPage({ onNavigate }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState(null);
  const [page, setPage] = useState(0);
  const [searched, setSearched] = useState('');
  const [value, setValue] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Estados de Asistencia y QR (HU-13)
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const [recordingAttendance, setRecordingAttendance] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [loadingAttendances, setLoadingAttendances] = useState(false);

  const sequence = useRef(0);

  useEffect(() => () => {
    sequence.current += 1;
  }, [token]);

  async function loadAttendanceHistory(clientId) {
    setLoadingAttendances(true);
    setAttendanceError('');
    try {
      const list = await getMemberAttendance(clientId, token);
      setAttendances(Array.isArray(list) ? list : []);
    } catch {
      setAttendances([]);
    } finally {
      setLoadingAttendances(false);
    }
  }

  async function search(nextPage = 0, term = query) {
    const request = ++sequence.current;
    setBusy(true);
    setError('');
    setAttendanceSuccess('');
    setAttendanceError('');
    setValue(null);
    setSelected(null);
    setClients(null);
    setAttendances([]);

    try {
      const result = await searchClientsApi(term, nextPage, 20, token);
      if (request === sequence.current) {
        setClients(result);
        setPage(nextPage);
        setSearched(term);
      }
    } catch (e) {
      if (request === sequence.current) setError(e.message);
    } finally {
      if (request === sequence.current) setBusy(false);
    }
  }

  async function handleCheckIn(clientId, fromQr = false) {
    setRecordingAttendance(true);
    setAttendanceSuccess('');
    setAttendanceError('');

    try {
      const res = await checkInMember(clientId, token);
      if (res.recorded) {
        setAttendanceSuccess(
          fromQr
            ? `✓ Ingreso por QR validado autoritativamente. Asistencia registrada exitosamente (${res.attendanceDate}).`
            : `✓ Asistencia presencial registrada exitosamente (${res.attendanceDate}).`
        );
      } else {
        setAttendanceSuccess(
          `ℹ La asistencia de este miembro para hoy (${res.attendanceDate}) ya se encontraba registrada previamente.`
        );
      }
      loadAttendanceHistory(clientId);
    } catch (e) {
      setAttendanceError(`No se pudo registrar la asistencia: ${e.message}`);
    } finally {
      setRecordingAttendance(false);
    }
  }

  async function verify(client, autoCheckIn = false) {
    const request = ++sequence.current;
    setBusy(true);
    setValue(null);
    setError('');
    setAttendanceSuccess('');
    setAttendanceError('');
    setSelected(client);
    setAttendances([]);

    try {
      const result = await verifyCoverage(client.id, token);
      if (request === sequence.current) {
        setValue(result);
        loadAttendanceHistory(client.id);

        // HU-13 T09: Check-in automático en lectura QR si el ingreso está autorizado
        if (autoCheckIn && result.allowed) {
          await handleCheckIn(client.id, true);
        }
      }
    } catch (e) {
      if (request === sequence.current) setError(`No se pudo verificar el ingreso del miembro. ${e.message}`);
    } finally {
      if (request === sequence.current) setBusy(false);
    }
  }

  async function handleQrSuccess(parsed) {
    setQrModalOpen(false);
    setError('');
    setAttendanceSuccess('');
    setAttendanceError('');
    setValue(null);
    setSelected(null);
    setClients(null);
    setBusy(true);

    try {
      let targetClient = null;

      if (parsed.type === 'MEMBER_CODE') {
        const searchRes = await searchClientsApi(parsed.identifier, 0, 5, token);
        if (searchRes?.content?.length > 0) {
          targetClient = searchRes.content.find(
            (c) => c.memberCode?.toUpperCase() === parsed.identifier.toUpperCase()
          ) || searchRes.content[0];
        }
      } else if (parsed.type === 'CLIENT_ID') {
        const searchRes = await searchClientsApi(parsed.identifier, 0, 5, token);
        if (searchRes?.content?.length > 0) {
          targetClient = searchRes.content[0];
        }
      }

      if (!targetClient) {
        setError(`No se encontró ningún miembro con el código escaneado (${parsed.identifier}).`);
        setBusy(false);
        return;
      }

      setQuery(targetClient.memberCode || targetClient.firstName);
      await verify(targetClient, true);
    } catch (e) {
      setError(`Error al procesar el código QR: ${e.message}`);
      setBusy(false);
    }
  }

  const handleClear = () => {
    sequence.current += 1;
    setQuery('');
    setClients(null);
    setSelected(null);
    setValue(null);
    setError('');
    setAttendanceSuccess('');
    setAttendanceError('');
    setAttendances([]);
    setBusy(false);
  };

  return (
    <section className="verification-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <OperationsNav activeTab="verification" onNavigate={onNavigate} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
          Verificación de Ingreso y Control de Asistencia
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Identifique al miembro mediante búsqueda manual o escaneo de código QR para autorizar su acceso y registrar asistencia.
        </p>
      </div>

      {/* Buscador de Miembro y Acceso a Escáner QR */}
      <form
        className="card"
        style={{ padding: '24px', marginBottom: '24px' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) search();
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="form-label" htmlFor="verification-search">
              Buscar Miembro por Nombre, DNI o Código (MAR-XXXXXX)
            </label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <Icon name="search" size={16} color="var(--color-text-muted)" />
              </span>
              <input
                id="verification-search"
                className="form-input with-left-icon"
                value={query}
                onChange={(e) => {
                  sequence.current += 1;
                  setBusy(false);
                  setQuery(e.target.value);
                  setValue(null);
                  setSelected(null);
                  setClients(null);
                  setError('');
                  setAttendanceSuccess('');
                  setAttendanceError('');
                  setAttendances([]);
                }}
                placeholder="Ej. Valeria Mendoza o 74859612"
                required
                autoFocus
              />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={busy || !query.trim()} style={{ minHeight: '44px' }}>
            <Icon name="search" size={16} />
            <span>Consultar Miembro</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setQrModalOpen(true)}
            disabled={busy}
            style={{ minHeight: '44px', borderColor: 'var(--color-gold)' }}
            title="Escanear credencial QR con cámara web o lector USB (HU-13 T05)"
          >
            <Icon name="camera" size={16} color="var(--color-gold)" />
            <span>Escanear Código QR</span>
          </Button>

          {(clients || value) && (
            <Button type="button" variant="secondary" onClick={handleClear} disabled={busy} style={{ minHeight: '44px' }}>
              <span>Nueva Consulta</span>
            </Button>
          )}
        </div>
      </form>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {attendanceSuccess && <Alert variant="success" message={attendanceSuccess} onClose={() => setAttendanceSuccess('')} />}
      {attendanceError && <Alert variant="danger" message={attendanceError} onClose={() => setAttendanceError('')} />}

      {busy && (
        <div style={{ textAlign: 'center', padding: '32px' }} role="status">
          <p style={{ color: 'var(--color-gold)', fontWeight: 600 }}>Consultando al servidor central de validación...</p>
        </div>
      )}

      {/* Resultados de Búsqueda si hay múltiples coincidencias */}
      {clients && !value && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
            Miembros Encontrados ({clients.totalElements})
          </h2>

          {!clients.content.length ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                No se encontraron miembros registrados con el término "{searched}".
              </p>
              {onNavigate && (
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('clients')}
                  style={{ marginTop: '16px', fontSize: '13px' }}
                >
                  <Icon name="plus" size={14} />
                  <span>Registrar Nuevo Miembro</span>
                </Button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {clients.content.map((client) => (
                <div
                  className="card"
                  key={client.id}
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {client.firstName} {client.lastName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {client.documents?.map((d) => `${d.documentType} ${d.documentNumber}`).join(' · ') || 'Sin documento'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-gold)', fontWeight: 600, marginTop: '2px' }}>
                      Código: {client.memberCode}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => verify(client, false)}
                    style={{ width: '100%', minHeight: '40px' }}
                  >
                    <Icon name="check-circle" size={15} />
                    <span>Verificar Acceso</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {clients.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <Button
                variant="secondary"
                disabled={busy || page === 0}
                onClick={() => search(page - 1, searched)}
              >
                Anterior
              </Button>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Página {page + 1} de {clients.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={busy || clients.last}
                onClick={() => search(page + 1, searched)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Veredicto de Cobertura y Control de Asistencia */}
      {value && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CoverageCard
            value={value}
            onGoToRenewal={onNavigate ? () => onNavigate('memberships') : undefined}
          />

          {/* Panel de Control de Asistencia en Mostrador (HU-13 T09) */}
          <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-primary)' }}>
                Registro de Asistencia de Hoy
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {value.allowed
                  ? 'La membresía está habilitada. Puede registrar la entrada presencial en mostrador.'
                  : `Ingreso no permitido: ${value.reason}`}
              </p>
            </div>

            <Button
              variant="primary"
              disabled={!value.allowed || recordingAttendance || busy}
              onClick={() => selected && handleCheckIn(selected.id, false)}
              style={{ minHeight: '42px', minWidth: '190px' }}
              title={value.allowed ? 'Registrar asistencia diaria del miembro' : 'Membresía no habilitada para ingresar'}
            >
              <Icon name="check-circle" size={16} />
              <span>{recordingAttendance ? 'Registrando...' : 'Registrar Asistencia'}</span>
            </Button>
          </div>

          {/* Historial de Asistencias Recientes (HU-13 T10) */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Historial de Asistencias del Miembro
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-gold)', fontWeight: 600 }}>
                {loadingAttendances ? 'Cargando...' : `${attendances.length} asistencias registradas`}
              </span>
            </div>

            {loadingAttendances ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Consultando asistencias...</p>
            ) : attendances.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                Este miembro aún no registra ingresos en el sistema.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-subtle, rgba(255,255,255,0.08))', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>Fecha</th>
                      <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>Hora de Ingreso (Lima)</th>
                      <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>Registrado Por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.slice(0, 10).map((att) => (
                      <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {att.attendance_date}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                          {formatLimaTime(att.checked_at_utc)}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-gold)' }}>
                          {att.recorded_by}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Acciones Finales */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '6px' }}>
            {selected && (
              <Button variant="secondary" disabled={busy} onClick={() => verify(selected, false)}>
                <Icon name="refresh" size={15} />
                <span>Volver a Consultar</span>
              </Button>
            )}
            <Button variant="primary" onClick={handleClear}>
              <span>Atender Siguiente Miembro</span>
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Escaneo QR (Cámara Web / Lector USB) */}
      <QrScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onScanSuccess={handleQrSuccess}
      />
    </section>
  );
}
