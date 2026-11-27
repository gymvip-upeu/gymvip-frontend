// ==============================================================================
// GYM VIP — Pantalla: IntegracionesPage (Centro de Integraciones y APIs COR-19)
// Consume estado en vivo cacheado del backend (/api/v1/channels/status, /api/v1/system/status)
// Sin exponer credenciales privadas ni quemar cuota de terceros desde el navegador.
// ==============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getChannelStatusApi } from '../../api/facilityApi';
import { getMembershipPaymentConfig } from '../../api/membershipApi';
import { httpClient } from '../../api/httpClient';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icons';
import ChannelStatusPanel from '../../components/common/ChannelStatusPanel';

const stateLabel = {
  UNVERIFIED: 'Sin verificar',
  UNCONFIGURED: 'Sin configurar',
  CONFIGURED_REAL: 'Configurado · pendiente de verificar',
  TEST: 'Pruebas',
  SIMULATION: 'Simulación',
  VERIFIED: 'Verificado',
  AVAILABLE: 'Disponible',
  UP: 'Operativo',
  DOWN: 'Caído',
  DISABLED: 'Desactivado',
};

const badgeFor = (status) => {
  const norm = String(status || '').toUpperCase();
  if (['UP', 'HEALTHY', 'AVAILABLE', 'ACTIVE', 'ENABLED', 'VERIFIED'].includes(norm)) return 'success';
  if (['SIMULATION', 'DEGRADED', 'UNVERIFIED', 'TEST', 'CONFIGURED_REAL'].includes(norm)) return 'warning';
  return 'danger';
};

export default function IntegracionesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemStatus, setSystemStatus] = useState(null);
  const [channels, setChannels] = useState(null);
  const [culqiMode, setCulqiMode] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sysRes, chanRes, culqiRes] = await Promise.all([
        httpClient('/api/v1/system/status', {}, token).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        getChannelStatusApi(token).catch(() => null),
        getMembershipPaymentConfig(token).catch(() => null),
      ]);
      setSystemStatus(sysRes);
      setChannels(chanRes?.channels || null);
      setCulqiMode(culqiRes?.culqiMode || (culqiRes?.culqiEnabled === false ? "UNCONFIGURED" : "UNVERIFIED"));
      setLastChecked(
        new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      if (!sysRes && !chanRes) {
        setError('No se pudo obtener respuesta de diagnóstico desde el backend central.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const catalog = [
    {
      name: 'Base de Datos PostgreSQL',
      category: 'Persistencia Transaccional',
      status: systemStatus?.database?.status || 'UNVERIFIED',
      detail: `${systemStatus?.database?.engine || 'PostgreSQL'} · Latencia ${systemStatus?.database?.latencyMs ?? '—'} ms`,
    },
    {
      name: 'Microservicio Comunicaciones',
      category: 'Orquestación Outbox',
      status: channels && [channels.whatsapp, channels.email].some((channel) => channel?.source === 'comunicaciones' && channel.status !== 'UNVERIFIED') ? 'AVAILABLE' : 'UNVERIFIED',
      detail: 'Puente REST autenticado para WhatsApp Meta API y Resend Email.',
    },
    {
      name: 'WhatsApp Business (Meta Cloud API)',
      category: 'Mensajería Transaccional',
      status: channels?.whatsapp?.status || 'UNVERIFIED',
      detail: channels?.whatsapp?.provider || 'Meta Graph API · modo controlado',
    },
    {
      name: 'Correo Electrónico (Resend API)',
      category: 'Activación y Recuperación',
      status: channels?.email?.status || 'UNVERIFIED',
      detail: channels?.email?.provider || 'Resend API',
    },
    {
      name: 'Pasarela Culqi (Links y Webhook)',
      category: 'Pagos Digitales PEN',
      status: culqiMode || 'UNVERIFIED',
      detail: culqiMode === 'TEST' ? 'CulqiLink acepta operaciones de prueba.' : 'Configuración de CulqiLink y conciliación de pagos.',
    },
    {
      name: 'Firebase Cloud Messaging (FCM)',
      category: 'Notificaciones Push Móvil',
      status: channels?.push?.status || 'UNVERIFIED',
      detail: 'Configuración de envío push. La entrega se verifica en Android.',
    },
    {
      name: 'ApiPeruDev (RENIEC / DNI)',
      category: 'Validación Documentaria',
      status: systemStatus?.features?.identityLookup || 'UNVERIFIED',
      detail: 'La configuración se consulta sin consumir cuota. La respuesta se verifica al buscar un DNI.',
    },
    {
      name: 'Sentry · Portal web',
      category: 'Observabilidad de Errores',
      status: import.meta.env.VITE_SENTRY_DSN ? 'CONFIGURED_REAL' : 'UNVERIFIED',
      detail: 'Solo DSN público en cliente; tokens privados nunca se exponen en SPA.',
    },
    {
      name: 'Sentry · Backend',
      category: 'Observabilidad de errores',
      status: systemStatus?.features?.sentry || 'UNVERIFIED',
      detail: 'Captura de errores técnicos del servidor.',
    },
    {
      name: 'Azure Container Apps',
      category: 'Infraestructura Cloud',
      status: systemStatus?.runtime?.platform === 'AZURE_CONTAINER_APPS' && systemStatus?.status === 'HEALTHY' ? 'UP' : 'UNVERIFIED',
      detail: 'Entorno informado por el backend: ' + (systemStatus?.runtime?.platform || 'sin verificar'),
    },
  ];

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
          Diagnóstico centralizado en vivo de APIs, mensajería, pasarelas de pago y servicios cloud sin consumir cuotas innecesarias.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastChecked && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Última verificación: {lastChecked} (Lima)
            </span>
          )}
          <Button variant="primary" onClick={loadAll} disabled={loading}>
            <Icon name="refresh" size={15} />
            <span>{loading ? 'Comprobando…' : 'Probar Conexiones'}</span>
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
        {catalog.map((item) => (
          <article
            key={item.name}
            className="card"
            style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {item.category}
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {item.name}
                </h3>
              </div>
              <Badge variant={badgeFor(item.status)}>{stateLabel[item.status] || item.status}</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {item.detail}
            </p>
          </article>
        ))}
      </div>

      <ChannelStatusPanel />
    </section>
  );
}
