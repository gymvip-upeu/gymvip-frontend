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
    getChannelStatusApi(token, controller.signal).then(result => {
      if (!result?.channels?.whatsapp?.status || !result?.channels?.app?.inbox) throw new Error('Reporte incompleto');
      if (!controller.signal.aborted) {
        if (result.channels.whatsapp.status !== 'UNVERIFIED') lastWhatsApp.current = result.channels.whatsapp.status;
        setData(result);
      }
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, refresh]);
  const wa = data?.channels?.whatsapp;
  const unverified = failed || wa?.status === 'UNVERIFIED';
  return <section className="reminders-card channel-status-panel" aria-label="Estado de canales">
    <header><h2>Estado de canales</h2><button type="button" className="btn btn-secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>{loading ? 'Consultando…' : 'Actualizar canales'}</button></header>
    <div className="channel-status-grid">
      <section><h3>WhatsApp</h3>
        <p role="status"><strong>{loading ? 'Consultando configuración…' : unverified ? 'No se pudo verificar' : channelStatusLabel(wa?.status)}</strong></p>
        {unverified && lastWhatsApp.current && <p>Última configuración conocida: {channelStatusLabel(lastWhatsApp.current)}.</p>}
        <p>Configuración consultada en comunicaciones. No confirma conexión con Meta ni entrega de mensajes.</p>
      </section>
      <section><h3>App móvil</h3>
        <p><strong>Bandeja de Avisos</strong>: {loading ? 'consultando…' : failed ? 'estado sin verificar' : data?.channels?.app?.inbox?.status === 'AVAILABLE' ? 'disponible' : 'estado sin verificar'}.</p>
        <p>La bandeja funciona sin Firebase al actualizar la app.</p>
        <p><strong>Notificaciones push</strong>: {loading ? 'consultando…' : failed ? 'estado sin verificar' : channelStatusLabel(data?.channels?.app?.push?.status)}.</p>
      </section>
    </div>
    <p>El estado actual de los canales no modifica los resultados de los intentos anteriores.</p>
  </section>;
}
