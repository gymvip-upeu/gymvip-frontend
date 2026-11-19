// ==============================================================================
// GYM VIP — Modal de Terminal de Asistencia QR Invertido (Mostrador / Recepción)
// Genera y rota el desafío temporal de la terminal cada 20 segundos y muestra
// el feed de ingresos validados en tiempo real.
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  getTerminalsApi,
  activateTerminalApi,
  getTerminalChallengeApi,
  getTerminalFeedApi,
} from '../../api/attendanceApi.js';
import QrCodeSvg from '../common/QrCodeSvg.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Alert.jsx';
import { Icon } from '../common/Icons.jsx';

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

export default function ReceptionTerminalModal({
  isOpen,
  onClose,
  token,
  user,
  onNavigateAgenda,
}) {
  const [terminal, setTerminal] = useState(null);
  const [challengeData, setChallengeData] = useState(null);
  const [feed, setFeed] = useState([]);
  const [secondsRemaining, setSecondsRemaining] = useState(20);
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedSuspended, setFeedSuspended] = useState(false);
  const [feedError, setFeedError] = useState('');

  const countdownTimerRef = useRef(null);
  const feedTimeoutRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const feedAbortControllerRef = useRef(null);
  const challengeAbortControllerRef = useRef(null);

  // Limpiar todos los temporizadores y peticiones abortables
  const clearAllTimersAndRequests = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (feedTimeoutRef.current) clearTimeout(feedTimeoutRef.current);
    if (feedAbortControllerRef.current) feedAbortControllerRef.current.abort();
    if (challengeAbortControllerRef.current) challengeAbortControllerRef.current.abort();
  };

  // Inicializar terminal al abrir
  useEffect(() => {
    if (!isOpen) {
      clearAllTimersAndRequests();
      return;
    }

    let isSubscribed = true;

    async function initTerminal() {
      setLoading(true);
      setError('');
      try {
        const terminals = await getTerminalsApi(token);
        if (!isSubscribed) return;

        if (!terminals || terminals.length === 0) {
          setError('No hay terminales mostrador configuradas en el sistema.');
          setLoading(false);
          return;
        }

        // Seleccionar terminal principal o primera activa
        let activeTerm = terminals.find((t) => t.status === 'ACTIVO') || terminals[0];

        // Si no está activa o tiene operador distinto, activarla para este usuario
        const opName = user?.name || user?.email || 'Recepcionista';
        if (activeTerm.status !== 'ACTIVO' || activeTerm.currentOperator !== opName) {
          try {
            activeTerm = await activateTerminalApi(activeTerm.id, opName, token);
          } catch {
            // Continuar con la terminal seleccionada
          }
        }

        if (!isSubscribed) return;

        setTerminal(activeTerm);
        await fetchNewChallenge(activeTerm.id);
        consecutiveErrorsRef.current = 0;
        setFeedSuspended(false);
        setFeedError('');
        scheduleNextFeedPoll(activeTerm.id, 0);
      } catch (err) {
        if (isSubscribed) {
          setError(err.message || 'Error al conectar con la terminal mostrador.');
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    initTerminal();

    return () => {
      isSubscribed = false;
      clearAllTimersAndRequests();
    };
  }, [isOpen, token, user]);

  async function fetchNewChallenge(terminalId) {
    if (!terminalId) return;
    try {
      const data = await getTerminalChallengeApi(terminalId, token);
      setChallengeData(data);
      const ttl = data.refreshIntervalSeconds || 20;
      setSecondsRemaining(ttl);

      // Reiniciar cuenta regresiva
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            fetchNewChallenge(terminalId);
            return 20;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Error al rotar el desafío QR.');
    }
  }

  function scheduleNextFeedPoll(terminalId, delayMs = 4000) {
    if (feedTimeoutRef.current) clearTimeout(feedTimeoutRef.current);
    feedTimeoutRef.current = setTimeout(async () => {
      await executeFeedPoll(terminalId);
    }, delayMs);
  }

  async function executeFeedPoll(terminalId) {
    if (!terminalId) return;

    if (feedAbortControllerRef.current) {
      feedAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    feedAbortControllerRef.current = controller;

    try {
      const feedItems = await getTerminalFeedApi(terminalId, 10, token, controller.signal);
      setFeed(Array.isArray(feedItems) ? feedItems : []);
      consecutiveErrorsRef.current = 0;
      setFeedSuspended(false);
      setFeedError('');

      // Siguiente sondeo a velocidad normal (4s)
      scheduleNextFeedPoll(terminalId, 4000);
    } catch (err) {
      if (err.name === 'AbortError') return;

      consecutiveErrorsRef.current += 1;
      const errors = consecutiveErrorsRef.current;

      if (errors >= 3) {
        // Suspender sondeo tras 3 fallos consecutivos para evitar saturación de red y consola
        setFeedSuspended(true);
        setFeedError('Sondeo pausado tras 3 intentos fallidos de conexión con la terminal.');
      } else {
        // Backoff exponencial progresivo: 4s -> 8s -> 16s
        const backoffMs = Math.min(16000, 4000 * Math.pow(2, errors));
        scheduleNextFeedPoll(terminalId, backoffMs);
      }
    }
  }

  function handleRetryFeed() {
    if (!terminal?.id) return;
    consecutiveErrorsRef.current = 0;
    setFeedSuspended(false);
    setFeedError('');
    scheduleNextFeedPoll(terminal.id, 0);
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg-surface, #14161D)',
          border: '1px solid var(--color-gold, #D4AF37)',
          borderRadius: '18px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(212,175,55,0.12) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold, #D4AF37)',
              }}
            >
              <Icon name="qr-code" size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--color-text-primary, #FFFFFF)', fontWeight: 700 }}>
                Terminal Mostrador — QR en Pantalla
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--color-gold, #D4AF37)' }}>
                {terminal?.name || 'Iniciando terminal mostrador...'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: terminal?.status === 'ACTIVO' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                color: terminal?.status === 'ACTIVO' ? '#2ECC71' : '#E74C3C',
              }}
            >
              {terminal?.status === 'ACTIVO' ? '● TERMINAL ACTIVA' : 'INACTIVA'}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #8A92A6)',
                cursor: 'pointer',
                fontSize: '22px',
                lineHeight: 1,
              }}
              title="Cerrar terminal"
            >
              ×
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 24px' }}>
            <Alert type="danger" message={error} />
          </div>
        )}

        {/* Contenido Principal: QR + Feed */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) 340px',
            gap: '24px',
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          {/* Lado Izquierdo: Código QR con temporizador */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ marginBottom: '14px', textAlign: 'center' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary, #A0AEC0)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Escanear con App GYM VIP Móvil
              </span>
            </div>

            {/* Código QR */}
            <div
              style={{
                padding: '14px',
                backgroundColor: '#0E0F12',
                borderRadius: '16px',
                border: '2px solid var(--color-gold, #D4AF37)',
                boxShadow: '0 0 24px rgba(212, 175, 55, 0.2)',
              }}
            >
              <QrCodeSvg
                value={challengeData?.challengeToken || ''}
                size={230}
                color="#D4AF37"
                bgColor="#0E0F12"
              />
            </div>

            {/* Temporizador de rotación */}
            <div
              style={{
                marginTop: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--color-text-primary, #FFFFFF)',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: secondsRemaining <= 5 ? '#E74C3C' : '#D4AF37',
                  animation: 'pulse 1s infinite',
                }}
              />
              <span>
                Rotación de seguridad en:{' '}
                <strong style={{ color: 'var(--color-gold, #D4AF37)', fontSize: '15px' }}>
                  {secondsRemaining}s
                </strong>
              </span>
            </div>

            {/* Barra de progreso de cuenta regresiva */}
            <div
              style={{
                width: '240px',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                marginTop: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(secondsRemaining / (challengeData?.refreshIntervalSeconds || 20)) * 100}%`,
                  backgroundColor: secondsRemaining <= 5 ? '#E74C3C' : '#D4AF37',
                  transition: 'width 1s linear',
                }}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <Button
                variant="ghost"
                onClick={() => terminal && fetchNewChallenge(terminal.id)}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <Icon name="refresh" size={13} />
                <span>Rotar desafío ahora</span>
              </Button>
            </div>
          </div>

          {/* Lado Derecho: Feed de Asistencias en Vivo */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '16px',
              padding: '18px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Feed en Vivo
                </span>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: feedSuspended ? '#E74C3C' : '#2ECC71',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: feedSuspended ? '#E74C3C' : 'var(--color-text-muted)' }}>
                {feedSuspended ? 'Pausado por error' : 'Últimos ingresos'}
              </span>
            </div>

            {feedSuspended ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 16px',
                  backgroundColor: 'rgba(231, 76, 60, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(231, 76, 60, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ color: '#E74C3C' }}>
                  <Icon name="alert-triangle" size={28} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#FFFFFF' }}>
                    Sondeo Temporalmente Pausado
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {feedError || 'No se pudo comunicar con el feed de la terminal tras 3 intentos.'}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleRetryFeed}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Icon name="refresh" size={13} />
                  <span>Reconectar sondeo</span>
                </Button>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feed.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    <p style={{ margin: 0 }}>Esperando escaneos de socios...</p>
                    <p style={{ margin: '6px 0 0', fontSize: '11px', opacity: 0.8 }}>
                      Los ingresos registrados aparecerán aquí automáticamente.
                    </p>
                  </div>
                ) : (
                  feed.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderLeft: `3px solid ${
                          item.status === 'ATTENDANCE_RECORDED' || item.status === 'APROBADO'
                            ? '#2ECC71'
                            : item.status === 'ALREADY_REGISTERED'
                            ? '#D4AF37'
                            : '#E74C3C'
                        }`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {item.memberName || 'Socio GYM VIP'}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                          {formatLimaTime(item.checkedAtUtc || item.checked_at_utc)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ color: 'var(--color-gold)', fontFamily: 'monospace' }}>
                          {item.memberCode || item.member_code}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color:
                              item.status === 'ATTENDANCE_RECORDED' || item.status === 'APROBADO'
                                ? '#2ECC71'
                                : item.status === 'ALREADY_REGISTERED'
                                ? '#D4AF37'
                                : '#E74C3C',
                          }}
                        >
                          {item.status === 'ATTENDANCE_RECORDED' || item.status === 'APROBADO'
                            ? 'INGRESO'
                            : item.status === 'ALREADY_REGISTERED'
                            ? 'YA INGRESÓ HOY'
                            : 'RECHAZADO'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              if (onNavigateAgenda) onNavigateAgenda();
            }}
          >
            <Icon name="calendar" size={15} />
            <span>Consultar Agenda de Asistencias</span>
          </Button>

          <Button variant="primary" onClick={onClose}>
            <span>Listo / Cerrar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
