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

export default function SettingsPage({ initialTab = 'rules', onNavigate }) {
  const { token, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Estados de datos reales de recordatorios
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');
  const [reminderConfig, setReminderConfig] = useState(null);
  const [cuts, setCuts] = useState([]);
  const [cutsError, setCutsError] = useState('');

  // Estado del microservicio de comunicaciones
  const [serviceHealth, setServiceHealth] = useState({
    loading: true,
    status: 'UNKNOWN',
    mode: 'simulation',
    provider: 'meta',
    error: null,
  });

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

  // Consultar estado de salud del servicio de comunicaciones
  const checkServiceHealth = useCallback(async () => {
    setServiceHealth((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await httpClient('/api/v1/health', {}, token);
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        setServiceHealth({
          loading: false,
          status: body.status || 'UP',
          mode: body.mode || 'simulation',
          provider: body.whatsappProvider || 'meta',
          error: null,
        });
      } else {
        setServiceHealth({
          loading: false,
          status: 'DOWN',
          mode: 'simulation',
          provider: 'simulation',
          error: `Respuesta HTTP ${res.status}`,
        });
      }
    } catch (err) {
      setServiceHealth({
        loading: false,
        status: 'DISCONNECTED',
        mode: 'simulation',
        provider: 'simulation',
        error: err.message || 'No se pudo conectar con el microservicio.',
      });
    }
  }, [token]);

  useEffect(() => {
    loadReminderConfig();
    checkServiceHealth();
  }, [loadReminderConfig, checkServiceHealth]);

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
        </div>
      </div>

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

      {/* PESTAÑA 2: MICROSERVICIO DE COMUNICACIONES */}
      {activeTab === 'comms' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                  <Icon name="message-circle" size={20} />
                </span>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Estado de Enlace con gymvip-comunicaciones
                </h2>
              </div>
              <Button variant="secondary" onClick={checkServiceHealth} disabled={serviceHealth.loading}>
                <Icon name="refresh" size={14} />
                <span>Verificar Conexión</span>
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Estado de Conexión</span>
                <div style={{ marginTop: '6px' }}>
                  <Badge variant={serviceHealth.status === 'UP' ? 'success' : 'danger'}>
                    {serviceHealth.status === 'UP' ? 'EN LÍNEA (UP)' : 'DESCONECTADO O EN ESPERA'}
                  </Badge>
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Modo de Operación</span>
                <strong style={{ fontSize: '14px', color: 'var(--color-gold)', display: 'block', marginTop: '4px' }}>
                  {serviceHealth.mode === 'simulation' ? 'SIMULATION (Modo Seguro Sin Costos)' : 'PRODUCTION (Meta API)'}
                </strong>
              </div>

              <div style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Proveedor WhatsApp</span>
                <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'block', marginTop: '4px' }}>
                  {serviceHealth.provider === 'meta' ? 'Meta Cloud API v20.0' : 'Simulation WhatsApp Adapter'}
                </strong>
              </div>
            </div>

            <div style={{ padding: '14px', background: 'var(--color-surface-panel)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gold-border)', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-gold)' }}>
                Plantillas Oficiales Registradas en Meta Business
              </h3>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>
                <li><code>recordatorio_vencimiento</code>: Envío anticipado a miembros próximos a expirar.</li>
                <li><code>aviso_vencido</code>: Notificación cortés de cobertura finalizada y opción de renovación.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => onNavigate?.('communications')}
                style={{ fontSize: '13px' }}
              >
                <span>Abrir Centro de Monitoreo de Comunicaciones →</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: PERSONAL Y ROLES (ADMIN) */}
      {activeTab === 'staff' && isAdmin() && (
        <StaffPage />
      )}
    </div>
  );
}
