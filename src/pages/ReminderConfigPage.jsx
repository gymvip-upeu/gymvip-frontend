// ==============================================================================
// GYM VIP — Pantalla de Configuración de Recordatorios y Cortes (HU-14)
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getReminderConfigApi,
  updateReminderConfigApi,
  evaluateRemindersNowApi,
  getReminderCutsApi,
} from '../api/reminderApi';
import { Icon } from '../components/common/Icons';
import '../themes/commsAndReminders.css';

const AVAILABLE_ANTICIPATION_DAYS = [3, 5, 7, 15];
const AVAILABLE_POST_EXPIRY_DAYS = [1, 2, 3, 4, 5];

export default function ReminderConfigPage() {
  const { token, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [evaluateResult, setEvaluateResult] = useState(null);

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [anticipationDays, setAnticipationDays] = useState([3, 5, 7]);
  const [postExpiryDays, setPostExpiryDays] = useState(2);
  const [defaultChannel, setDefaultChannel] = useState('WHATSAPP');

  // Preview Mode: 'anticipado' | 'vencido'
  const [previewMode, setPreviewMode] = useState('anticipado');

  // Historial de Cortes
  const [cuts, setCuts] = useState([]);
  const [loadingCuts, setLoadingCuts] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await getReminderConfigApi(token);
      setEnabled(config.enabled ?? true);
      setAnticipationDays(Array.isArray(config.anticipationDays) ? config.anticipationDays : [3, 5, 7]);
      setPostExpiryDays(config.postExpiryDays ?? 2);
      const initialChannel = (Array.isArray(config.channels) && config.channels[0]) || config.defaultChannel || 'WHATSAPP';
      setDefaultChannel(initialChannel);

      const cutsData = await getReminderCutsApi(token).catch(() => []);
      setCuts(cutsData || []);
    } catch (err) {
      setError(err.message || 'Error al cargar la configuración de recordatorios.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleAnticipationDay = (day) => {
    setAnticipationDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateReminderConfigApi(
        {
          enabled,
          anticipationDays,
          postExpiryDays: Number(postExpiryDays),
          channels: [defaultChannel],
          defaultChannel,
        },
        token
      );
      setSuccessMsg('Configuración de recordatorios guardada con éxito.');
    } catch (err) {
      setError(err.message || 'Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluateNow = async () => {
    if (!window.confirm('¿Desea ejecutar una evaluación y corte de vencimientos en este momento?')) {
      return;
    }
    setEvaluating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await evaluateRemindersNowApi(token);
      setEvaluateResult(result);
      setSuccessMsg(`Corte evaluado: ${result.candidatosEvaluados} socios analizados, ${result.avisosSolicitados} enviados, ${result.avisosOmitidos} omitidos.`);
      // Refrescar cortes
      const cutsData = await getReminderCutsApi(token).catch(() => []);
      setCuts(cutsData || []);
    } catch (err) {
      setError(err.message || 'Error al ejecutar la evaluación manual.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="reminders-page">
      <div className="reminders-heading">
        <div>
          <h1>Configuración de Recordatorios y Cortes de Vencimiento</h1>
          <p>Supervise las reglas automáticas de notificación de expiración de membresías y audite los cortes ejecutados.</p>
        </div>
        {isAdmin() && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleEvaluateNow}
            disabled={evaluating || loading}
          >
            <Icon name="refresh" size={15} style={{ marginRight: 6 }} />
            {evaluating ? 'Evaluando...' : 'Evaluar Ahora'}
          </button>
        )}
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state" style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
          Cargando parámetros de recordatorios...
        </div>
      ) : (
        <>
          <div className="reminders-grid">
            {/* Panel de Configuración de Reglas */}
            <form onSubmit={handleSave} className="reminders-card">
              <header>
                <h2>Reglas de Notificación de Membresías</h2>
                <span style={{ fontSize: 11, color: '#888' }}>Zona horaria: America/Lima</span>
              </header>

              {/* Master Switch */}
              <div className="master-toggle">
                <div className="toggle-label">
                  <strong>Servicio Automatizado de Recordatorios</strong>
                  <span>Habilita la emisión periódica de avisos antes y después del vencimiento.</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    disabled={!isAdmin()}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Días de Anticipación */}
              <div className="form-group-reminders">
                <label className="section-title">Días de Anticipación (Previos al Vencimiento)</label>
                <div className="days-chips-group">
                  {AVAILABLE_ANTICIPATION_DAYS.map((day) => {
                    const isChecked = anticipationDays.includes(day);
                    return (
                      <label key={day} className={`day-chip ${isChecked ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAnticipationDay(day)}
                          disabled={!isAdmin()}
                        />
                        <span>{day} días antes</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Días Posteriores al Vencimiento */}
              <div className="form-group-reminders">
                <label className="section-title">Aviso de Gracia / Posterior al Vencimiento</label>
                <div className="days-chips-group">
                  {AVAILABLE_POST_EXPIRY_DAYS.map((day) => {
                    const isSelected = postExpiryDays === day;
                    return (
                      <label key={day} className={`day-chip ${isSelected ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="postExpiryDays"
                          checked={isSelected}
                          onChange={() => setPostExpiryDays(day)}
                          disabled={!isAdmin()}
                        />
                        <span>{day} {day === 1 ? 'día después' : 'días después'}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Canal Preferido */}
              <div className="form-group-reminders">
                <label className="section-title">Canal Oficial de Emisión</label>
                <div className="days-chips-group">
                  {['WHATSAPP', 'EMAIL', 'APP'].map((channel) => (
                    <label key={channel} className={`day-chip ${defaultChannel === channel ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="defaultChannel"
                        checked={defaultChannel === channel}
                        onChange={() => setDefaultChannel(channel)}
                        disabled={!isAdmin()}
                      />
                      <span>{channel === 'WHATSAPP' ? 'WhatsApp Cloud' : channel === 'EMAIL' ? 'Correo Electrónico' : 'App Móvil (Push)'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isAdmin() && (
                <div className="reminders-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              )}
            </form>

            {/* Panel de Vista Previa de Plantilla Meta / WhatsApp */}
            <div className="reminders-card">
              <header>
                <h2>Vista Previa de Plantilla ({defaultChannel})</h2>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${previewMode === 'anticipado' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 11, padding: '4px 10px', minHeight: 28 }}
                    onClick={() => setPreviewMode('anticipado')}
                  >
                    Por Vencer
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${previewMode === 'vencido' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 11, padding: '4px 10px', minHeight: 28 }}
                    onClick={() => setPreviewMode('vencido')}
                  >
                    Vencido
                  </button>
                </div>
              </header>

              <div className="template-preview-box">
                <div className="template-header">
                  <Icon name="message-circle" size={14} />
                  <span>Meta Cloud API · Template: {previewMode === 'anticipado' ? 'recordatorio_vencimiento' : 'aviso_vencido'}</span>
                </div>

                <div className="template-bubble">
                  {previewMode === 'anticipado' ? (
                    `Hola {{1}}, te recordamos que tu membresía VIP {{2}} en GYM VIP vencerá el {{3}} (en {{4}} días).\n\nRenueva a tiempo para mantener tus accesos sin interrupción. Puedes hacerlo en recepción o vía nuestra plataforma.`
                  ) : (
                    `Estimado(a) {{1}}, tu membresía VIP {{2}} en GYM VIP venció el {{3}}.\n\nPara continuar disfrutando de las instalaciones, acércate a recepción o renueva desde tu panel digital. ¡Te esperamos!`
                  )}
                </div>

                <div style={{ marginTop: 14, fontSize: 11, color: '#999', lineHeight: 1.5 }}>
                  <strong style={{ color: '#dcdad4' }}>Variables inyectadas:</strong>
                  <div><code>{`{{1}}`}</code>: Nombre y apellido del socio</div>
                  <div><code>{`{{2}}`}</code>: Denominación del plan tarifario</div>
                  <div><code>{`{{3}}`}</code>: Fecha de término (DD/MM/YYYY)</div>
                  {previewMode === 'anticipado' && <div><code>{`{{4}}`}</code>: Días de anticipación restantes</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Historial de Cortes Evaluados */}
          <div className="reminders-card" style={{ marginTop: 24 }}>
            <header>
              <h2>Historial y Auditoría de Cortes</h2>
              <span style={{ fontSize: 12, color: '#888' }}>{cuts.length} ejecuciones registradas</span>
            </header>

            <div className="member-table-wrap">
              <table className="member-table">
                <thead>
                  <tr>
                    <th>Fecha de Corte</th>
                    <th>Tipo de Ejecución</th>
                    <th>Candidatos</th>
                    <th>Avisos Solicitados</th>
                    <th>Omitidos (Sin Consentimiento / Repetidos)</th>
                    <th>Ejecutado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {cuts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="member-empty">
                        <Icon name="calendar" size={32} color="#666" />
                        <p>No se han registrado cortes de evaluación todavía.</p>
                      </td>
                    </tr>
                  ) : (
                    cuts.map((cut, idx) => (
                      <tr key={cut.id || idx}>
                        <td>
                          <strong>{cut.cut_date || cut.corte_fecha || cut.corteFecha || 'Hoy'}</strong>
                          <small>{(cut.eval_timestamp_utc || cut.creado_el_utc) ? new Date(cut.eval_timestamp_utc || cut.creado_el_utc).toLocaleString('es-PE') : 'N/D'}</small>
                        </td>
                        <td>
                          <span className="member-status status-activo">
                            {cut.triggered_by || cut.corte_tipo || cut.corteTipo || 'MANUAL'}
                          </span>
                        </td>
                        <td>{cut.candidates_evaluated ?? cut.candidatos_evaluados ?? cut.candidatosEvaluados ?? 0}</td>
                        <td style={{ color: '#82c59e', fontWeight: 600 }}>
                          {cut.notices_requested ?? cut.avisos_solicitados ?? cut.avisosSolicitados ?? 0}
                        </td>
                        <td style={{ color: '#c3bcaa' }}>
                          {cut.notices_skipped ?? cut.avisos_omitidos ?? cut.avisosOmitidos ?? 0}
                        </td>
                        <td>{cut.triggered_by || cut.ejecutado_por || cut.ejecutadoPor || 'ADMIN'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
