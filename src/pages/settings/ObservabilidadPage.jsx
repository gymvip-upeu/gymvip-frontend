// ==============================================================================
// GYM VIP — Pantalla: ObservabilidadPage (Monitoreo, Telemetría y Auditoría COR-20)
// Muestra métricas reales de /api/v1/system/status, eventos de auditoría y prueba
// controlada de Sentry sin exponer tokens privados en frontend.
// ==============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { httpClient } from '../../api/httpClient';
import { getStaffAuditHistoryApi } from '../../api/staffApi';
import { triggerSentryTestVerification } from '../../config/sentry';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icons';

export default function ObservabilidadPage() {
  const { token, isAdmin } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sentryNotice, setSentryNotice] = useState(null);

  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sys, audits] = await Promise.all([
        httpClient('/api/v1/system/status', {}, token).then((r) => (r.ok ? r.json() : null)),
        getStaffAuditHistoryApi(token).catch(() => []),
      ]);
      setStatusData(sys);
      setAuditEvents(Array.isArray(audits) ? audits.slice(0, 15) : []);
      if (!sys) {
        setError('El endpoint de estado del sistema no respondió datos.');
      }
    } catch (e) {
      setError(e.message || 'Error consultando telemetría del servidor.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  const handleTestSentry = () => {
    try {
      const evt = triggerSentryTestVerification('Observabilidad GYM VIP');
      setSentryNotice(`Evento de verificación emitido al SDK de Sentry: "${evt?.message || 'Test OK'}".`);
    } catch (e) {
      setError(e?.message || 'Sentry está en modo local sin DSN activo o bloqueado por el navegador.');
    }
  };

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
          Salud de JVM, latencia de PostgreSQL, capacidades habilitadas y bitácora reciente de eventos de seguridad.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin() && (
            <Button variant="secondary" onClick={handleTestSentry}>
              <Icon name="alert-triangle" size={15} />
              <span>Verificar Evento Sentry</span>
            </Button>
          )}
          <Button variant="primary" onClick={loadTelemetry} disabled={loading}>
            <Icon name="refresh" size={15} />
            <span>{loading ? 'Actualizando…' : 'Actualizar Telemetría'}</span>
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {sentryNotice && <Alert variant="success" message={sentryNotice} onClose={() => setSentryNotice(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Estado Global Backend
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <strong style={{ fontSize: '22px', color: 'var(--color-gold)' }}>{statusData?.status || 'CONSULTANDO'}</strong>
            <Badge variant={statusData?.status === 'HEALTHY' ? 'success' : 'warning'}>{statusData?.service || 'gymvip-backend'}</Badge>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Timestamp UTC: {statusData?.timestamp || '—'}
          </p>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Base de Datos PostgreSQL
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <strong style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}>{statusData?.database?.latencyMs ?? '—'} ms</strong>
            <Badge variant={statusData?.database?.status === 'UP' ? 'success' : 'danger'}>{statusData?.database?.status || '—'}</Badge>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {statusData?.database?.engine || 'Motor PostgreSQL'}
          </p>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Memoria Heap JVM
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '8px' }}>
            {statusData?.jvm?.usedMemoryMb ?? '—'} / {statusData?.jvm?.maxMemoryMb ?? '—'} MB
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            CPUs disponibles: {statusData?.jvm?.availableProcessors ?? '—'}
          </p>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Módulos Activos
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {Object.entries(statusData?.features || {}).map(([k, v]) => (
              <Badge key={k} variant={v === 'ACTIVE' || v === 'ENABLED' ? 'gold' : 'neutral'}>
                {k}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--color-text-primary)' }}>
          Eventos Recientes de Auditoría
        </h2>
        {auditEvents.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
            No se registran eventos recientes para mostrar con tus permisos actuales.
          </p>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha (Lima)</th>
                  <th>Actor</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((ev, idx) => (
                  <tr key={ev.id || idx}>
                    <td style={{ fontSize: '12px' }}>
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : '—'}
                    </td>
                    <td style={{ fontSize: '12px', fontWeight: 600 }}>{ev.actorEmail || 'Sistema'}</td>
                    <td><Badge variant="gold">{ev.action}</Badge></td>
                    <td style={{ fontSize: '12px' }}>{ev.entityType || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{ev.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
