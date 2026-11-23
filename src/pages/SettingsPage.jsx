// ==============================================================================
// GYM VIP — Pantalla: SettingsPage (Configuración Operativa del Sistema)
// Parámetros reales persistidos: Reglas de Recordatorios, Conexión y Personal
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Icon } from '../components/common/Icons';
import { LoadingState } from '../components/feedback/LoadingState';
import StaffPage from './StaffPage';
import {
  getReminderConfigApi,
  getReminderCutsApi,
  evaluateRemindersNowApi,
} from '../api/reminderApi';
import { httpClient } from '../api/httpClient';
import ChannelStatusPanel from '../components/common/ChannelStatusPanel';
import { triggerSentryTestVerification } from '../config/sentry';

export default function SettingsPage({ initialTab = 'rules', onNavigate }) {
  const { token, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Estados de datos reales de recordatorios
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');
  const [reminderConfig, setReminderConfig] = useState(null);
  const [cuts, setCuts] = useState([]);
  const [sentryTestMessage, setSentryTestMessage] = useState(null);
  const [cutsError, setCutsError] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [revokingSessions, setRevokingSessions] = useState(false);

  // Cargar configuración de recordatorios desde el backend
  const loadReminderConfig = useCallback(async () => {
    if (!token) return;
    setLoadingConfig(true);
    setConfigError('');
    try {
      setReminderConfig(await getReminderConfigApi(token));
      try {
        setCuts(await getReminderCutsApi(token));
        setCutsError('');
      } catch (error) {
        setCutsError(error.message);
      }
    } catch (e) {
      setConfigError(e.message || 'No se pudo cargar la configuración de recordatorios del servidor.');
    } finally {
      setLoadingConfig(false);
    }
  }, [token]);

  useEffect(() => {
    loadReminderConfig();
  }, [loadReminderConfig]);

  // Ejecución manual de corte
  const handleEvaluateNow = async () => {
    if (!isAdmin()) return;
    setEvaluating(true);
    setConfigError('');
    setConfigSuccess('');
    try {
      const res = await evaluateRemindersNowApi(token);
      setConfigSuccess(res.message || `Corte manual ejecutado: ${res.evaluatedCount || 0} candidatos evaluados.`);
      loadReminderConfig();
    } catch (err) {
      setConfigError(err.message || 'Error al ejecutar el corte manual de recordatorios.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Se cerrarán todas las sesiones de esta cuenta, incluida la actual. ¿Continuar?')) return;
    setRevokingSessions(true);
    setSessionError('');
    try {
      const response = await httpClient('/api/v1/auth/revoke-all-sessions', { method: 'POST' }, token);
      if (!response.ok) throw new Error(`No se pudieron cerrar las sesiones (HTTP ${response.status}).`);
      await logout();
    } catch (error) {
      setSessionError(error.message || 'No se pudieron cerrar las sesiones.');
    } finally {
      setRevokingSessions(false);
    }
  };

  return (
    <div className="settings-page" style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
          Configuración Operativa
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '0 0 16px 0' }}>
          Consulta las reglas operativas, el estado de comunicaciones y la gestión de colaboradores.
        </p>

        {/* Pestañas de Navegación */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('rules')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '38px', borderRadius: 'var(--radius-md)' }}
          >
            <Icon name="bell" size={15} />
            <span>Reglas y Recordatorios</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'comms' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('comms')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '38px', borderRadius: 'var(--radius-md)' }}
          >
            <Icon name="message-circle" size={15} />
            <span>Microservicio de Comunicaciones</span>
          </button>

          {isAdmin() && (
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('staff')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '38px', borderRadius: 'var(--radius-md)' }}
            >
              <Icon name="shield-check" size={15} />
              <span>Personal y Roles</span>
              <Badge variant="gold" style={{ fontSize: '10px', marginLeft: '4px' }}>ADMIN</Badge>
            </button>
          )}

          {isAdmin() && (
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'diagnostics' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('diagnostics')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '38px', borderRadius: 'var(--radius-md)' }}
            >
              <Icon name="activity" size={15} />
              <span>Monitoreo & Sentry</span>
              <Badge variant="info" style={{ fontSize: '10px', marginLeft: '4px' }}>OBS</Badge>
            </button>
          )}
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('security')}
          >
            Seguridad de la cuenta
          </button>
        </div>
      </div>

      {activeTab === 'security' && (
        <section className="settings-card" style={{ padding: '24px' }}>
          <h2>Dispositivos y sesiones</h2>
          <p>Si perdiste tu teléfono, cierra todas las sesiones de esta cuenta. También se desactivarán sus dispositivos de notificación registrados.</p>
          {sessionError && <Alert variant="danger" message={sessionError} onClose={() => setSessionError('')} />}
          <Button onClick={handleRevokeAllSessions} disabled={revokingSessions}>
            {revokingSessions ? 'Cerrando sesiones…' : 'Cerrar todas las sesiones'}
          </Button>
        </section>
      )}

      {/* PESTAÑA 1: REGLAS Y RECORDATORIOS */}
      {activeTab === 'rules' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {configError && <Alert variant="danger" message={configError} onClose={() => setConfigError('')} />}
          {configSuccess && <Alert variant="success" message={configSuccess} onClose={() => setConfigSuccess('')} />}

          {loadingConfig ? (
            <LoadingState message="Cargando la configuración de recordatorios…" />
          ) : (
            <>
              {/* Tarjeta: Formulario de Parámetros Persistidos */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                      <Icon name="bell" size={20} />
                    </span>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                      Evaluación de vencimientos
                    </h2>
                  </div>
                  <Badge variant={isAdmin() ? 'gold' : 'neutral'}>
                    {isAdmin() ? 'Control Total ADMIN' : 'Modo Solo Lectura (Recepción)'}
                  </Badge>
                </div>

                {reminderConfig && (
                  <p>Estado guardado: <strong>{reminderConfig.enabled ? 'Habilitado' : 'Pausado'}</strong></p>
                )}
                {isAdmin() && (
                  <div className="reminder-actions">
                    <Button onClick={() => onNavigate('reminders')}>Abrir Recordatorios</Button>
                    <Button variant="secondary" onClick={handleEvaluateNow} disabled={evaluating}>
                      <Icon name="refresh" size={15} />
                      {evaluating ? 'Procesando corte…' : 'Ejecutar corte manual'}
                    </Button>
                  </div>
                )}
                <details className="settings-reminder-history">
                  <summary>Historial de cortes</summary>
                  {cutsError ? (
                    <Alert variant="danger" message={cutsError} />
                  ) : cuts.length === 0 ? (
                    <p>No se han registrado cortes de evaluación.</p>
                  ) : (
                    <div className="member-table-wrap">
                      <table className="member-table">
                        <thead>
                          <tr><th>Fecha</th><th>Candidatos</th><th>Avisos solicitados</th><th>Omitidos</th><th>Ejecutado por</th></tr>
                        </thead>
                        <tbody>
                          {cuts.map((cut) => (
                            <tr key={cut.id}>
                              <td>{cut.cut_date}</td>
                              <td>{cut.candidates_evaluated}</td>
                              <td>{cut.notices_requested}</td>
                              <td>{cut.notices_skipped}</td>
                              <td>{cut.triggered_by}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </details>
              </div>

              {/* Tarjeta: Reglas Canónicas Inmutables de Negocio */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                    <Icon name="shield-check" size={20} />
                  </span>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    Reglas de Negocio Aprobadas (Inmutables)
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px', fontSize: '13px' }}>
                  <div style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Duración Estándar</span>
                    <strong style={{ color: 'var(--color-gold)', fontSize: '14px' }}>30 Días Calendario Exactos</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: 1.4 }}>
                      Las coberturas mensuales inician el día de contratación y culminan a los 30 días exactos (inicio incluido, fin excluido).
                    </p>
                  </div>

                  <div style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Período de Gracia</span>
                    <strong style={{ color: 'var(--color-danger)', fontSize: '14px' }}>0 Días (Tolerancia Cero)</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: 1.4 }}>
                      Al vencer la vigencia, el acceso por torniquete y la validez de credenciales quedan denegados de forma inmediata.
                    </p>
                  </div>

                  <div style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Modalidad de Cobro</span>
                    <strong style={{ color: 'var(--color-success)', fontSize: '14px' }}>Pago Presencial en Caja</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: 1.4 }}>
                      Efectivo en Soles (PEN), tarjeta mediante POS físico o billeteras digitales (Yape/Plin con registro de número de operación).
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'comms' && <div><ChannelStatusPanel /><Button variant="secondary" onClick={() => onNavigate?.('communications')}>Abrir Seguimiento</Button></div>}

      {/* PESTAÑA 3: PERSONAL Y ROLES (ADMIN) */}
      {activeTab === 'staff' && isAdmin() && (
        <StaffPage />
      )}

      {/* PESTAÑA 4: MONITOREO Y DIAGNÓSTICO SENTRY (ADMIN) */}
      {activeTab === 'diagnostics' && isAdmin() && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {sentryTestMessage && (
            <Alert
              variant={sentryTestMessage.variant}
              title={sentryTestMessage.title}
              message={sentryTestMessage.message}
              onClose={() => setSentryTestMessage(null)}
            />
          )}

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                <Icon name="activity" size={20} />
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Observabilidad y Monitoreo de Errores (Sentry)
              </h2>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Sentry monitorea en tiempo real excepciones de frontend, trazas de rendimiento y sesiones en vivo con enmascaramiento estricto de privacidad.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <strong style={{ display: 'block', color: 'var(--color-gold)', marginBottom: '8px', fontSize: '13px' }}>
                  Proyecto Sentry
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Organización: <code>universidad-peruana-union-p0</code><br />
                  Proyecto Frontend: <code>gymvip-frontend</code><br />
                  Proyecto Backend: <code>gymvip-backend</code>
                </p>
              </div>

              <div style={{ padding: '16px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <strong style={{ display: 'block', color: 'var(--color-gold)', marginBottom: '8px', fontSize: '13px' }}>
                  Parámetros de Telemetría
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Traces Sample Rate: <code>0.2</code> (Prod) / <code>1.0</code> (Dev)<br />
                  Replays en Error: <code>1.0 (100%)</code><br />
                  Privacidad: <code>maskAllText + blockAllMedia + maskAllInputs</code>
                </p>
              </div>

              <div style={{ padding: '16px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <strong style={{ display: 'block', color: 'var(--color-gold)', marginBottom: '8px', fontSize: '13px' }}>
                  Filtros de Seguridad y Privacidad
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  ✔ Sanitización de contraseñas y tokens JWT.<br />
                  ✔ PII de clientes excluido en breadcrumbs.<br />
                  ✔ Respuestas HTTP 400 y 401 excluidas de alertas críticas.
                </p>
              </div>
            </div>

            <div style={{ padding: '18px', background: 'var(--color-surface-panel)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
                Prueba Controlada de Verificación
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                Emite intencionalmente una excepción de prueba tipificada hacia Sentry para comprobar que la tubería de captura y notificación se encuentra operativa. Esta acción está restringida a administradores.
              </p>

              <Button
                type="button"
                variant="warning"
                onClick={() => {
                  try {
                    const error = triggerSentryTestVerification('Panel de Control GYM VIP');
                    setSentryTestMessage({
                      variant: 'success',
                      title: 'Excepción de Prueba Enviada a Sentry',
                      message: `Se emitió exitosamente el evento "${error.message}". Consulta el issue generado en el dashboard de Sentry para confirmar la recepción.`,
                    });
                  } catch (err) {
                    setSentryTestMessage({
                      variant: 'danger',
                      title: 'Fallo al Emitir Prueba',
                      message: err.message || 'Error al comunicarse con el SDK de Sentry.',
                    });
                  }
                }}
                style={{ minHeight: '38px', fontSize: '13px' }}
              >
                <Icon name="activity" size={15} />
                <span>Emitir Excepción de Prueba Controlada a Sentry</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
