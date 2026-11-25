import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getChannelStatusApi } from '../../api/facilityApi';
import { channelStatusLabel } from '../../services/channelStatus';

export default function ChannelStatusPanel() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [failed, setFailed] = useState(false);
  const lastWhatsApp = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    getChannelStatusApi(token, controller.signal)
      .then((result) => {
        if (!result?.channels?.whatsapp?.status || !result?.channels?.app?.inbox) {
          throw new Error('Reporte incompleto');
        }
        if (!controller.signal.aborted) {
          if (result.channels.whatsapp.status !== 'UNVERIFIED') {
            lastWhatsApp.current = result.channels.whatsapp.status;
          }
          setData(result);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, refresh]);

  const wa = data?.channels?.whatsapp;
  const email = data?.channels?.email;
  const unverified = failed || wa?.status === 'UNVERIFIED';

  return (
    <section className="card" style={{ padding: '24px' }} aria-label="Estado de canales">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
          Estado de Canales y Bandeja Móvil
        </h2>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          {loading ? 'Consultando…' : 'Actualizar canales'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
        <section style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--color-gold)' }}>WhatsApp</h3>
          <p role="status" style={{ margin: '0 0 6px' }}>
            <strong>{loading ? 'Consultando configuración…' : unverified ? 'No se pudo verificar' : channelStatusLabel(wa?.status)}</strong>
          </p>
          {unverified && lastWhatsApp.current && (
            <p style={{ margin: '0 0 6px', color: 'var(--color-text-secondary)' }}>
              Última configuración conocida: {channelStatusLabel(lastWhatsApp.current)}.
            </p>
          )}
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '12px' }}>
            Configuración consultada en comunicaciones. No confirma conexión con Meta ni entrega de mensajes.
          </p>
        </section>

        <section style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--color-gold)' }}>Correo electrónico</h3>
          <p style={{ margin: '0 0 6px' }}>
            <strong>{loading ? 'Consultando…' : failed ? 'Estado sin verificar' : channelStatusLabel(email?.status)}</strong>
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '12px' }}>
            {email?.provider || 'Resend API / Simulación'}
          </p>
        </section>

        <section style={{ padding: '14px', background: 'var(--color-surface-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--color-gold)' }}>App móvil</h3>
          <p style={{ margin: '0 0 4px' }}>
            <strong>Bandeja de Avisos</strong>: {loading ? 'consultando…' : failed ? 'estado sin verificar' : data?.channels?.app?.inbox?.status === 'AVAILABLE' ? 'disponible' : 'estado sin verificar'}.
          </p>
          <p style={{ margin: '0 0 6px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
            La bandeja funciona sin Firebase al actualizar la app.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Notificaciones push</strong>: {loading ? 'consultando…' : failed ? 'estado sin verificar' : channelStatusLabel(data?.channels?.app?.push?.status)}.
          </p>
        </section>
      </div>

      <p style={{ margin: '12px 0 0', color: 'var(--color-text-muted)', fontSize: '12px' }}>
        El estado actual de los canales no modifica los resultados de los intentos anteriores.
      </p>
    </section>
  );
}
