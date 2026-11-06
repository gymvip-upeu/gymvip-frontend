// ==============================================================================
// GYM VIP — Panel Desplegable de Notificaciones y Alertas del Sistema
// Anclado bajo la campana del Header, con datos reales y navegación operativa
// ==============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from './Icons';
import { Badge } from './Badge';
import { Button } from './Button';
import { listCoverage } from '../../api/jorgeApi';
import { getReminderConfigApi, evaluateRemindersNowApi } from '../../api/reminderApi';
import { getCommunicationsApi, retryCommunicationApi } from '../../api/commsApi';
import { dateLabel } from '../members/memberUtils';

export function NotificationsModal({ isOpen, onClose, onNavigate }) {
  const panelRef = useRef(null);
  const { token, user, isAdmin, isRecepcion } = useAuth();

  const [activeTab, setActiveTab] = useState('vencimientos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Datos reales
  const [alerts, setAlerts] = useState([]);
  const [reminderConfig, setReminderConfig] = useState(null);
  const [commsItems, setCommsItems] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  // Persistencia de leídos/vistos en localStorage por usuario
  const storageKey = user?.email ? `gymvip_seen_alerts_${user.email}` : 'gymvip_seen_alerts_default';
  const [seenIds, setSeenIds] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markAllAsSeen = () => {
    const allIds = new Set(seenIds);
    alerts.forEach((a) => a.clientId && allIds.add(a.clientId));
    commsItems.forEach((c) => c.id && allIds.add(c.id));
    setSeenIds(allIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    setActionNotice('');

    try {
      if (activeTab === 'vencimientos') {
        if (isAdmin() || isRecepcion()) {
          const res = await listCoverage({ state: 'ALERTAS', page: 0, size: 8 }, token);
          const items = Array.isArray(res?.content) ? res.content : [];
          // Ordenar por fecha más próxima
          items.sort((a, b) => {
            const dA = a.lastIncludedDate ? new Date(`${a.lastIncludedDate}T00:00:00Z`).getTime() : Infinity;
            const dB = b.lastIncludedDate ? new Date(`${b.lastIncludedDate}T00:00:00Z`).getTime() : Infinity;
            return dA - dB;
          });
          setAlerts(items);
        }
      } else if (activeTab === 'recordatorios') {
        const config = await getReminderConfigApi(token).catch(() => null);
        setReminderConfig(config);
      } else if (activeTab === 'comunicaciones') {
        const comms = await getCommunicationsApi({ page: 0, size: 6 }, token).catch((err) => {
          setError(err.message || 'Microservicio de comunicaciones no disponible.');
          return { content: [] };
        });
        setCommsItems(Array.isArray(comms?.content) ? comms.content : []);
      }
    } catch (e) {
      setError(e.message || 'No fue posible consultar la información.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, token, isAdmin, isRecepcion]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Cierre al presionar Escape o clic exterior
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Ignorar clics dentro del botón de campana en el header
        const bellBtn = document.querySelector('.header-icon-btn[aria-label="Notificaciones"]');
        if (bellBtn && bellBtn.contains(e.target)) return;
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleEvaluateNow = async () => {
    setEvaluating(true);
    setActionNotice('');
    try {
      const res = await evaluateRemindersNowApi(token);
      setActionNotice(res.message || `Corte evaluado: ${res.evaluatedCount || 0} socios procesados.`);
      loadData();
    } catch (e) {
      setError(e.message || 'Error al ejecutar corte de recordatorios.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleRetryComms = async (id) => {
    setRetryingId(id);
    setActionNotice('');
    try {
      await retryCommunicationApi(id, token);
      setActionNotice('Reintento solicitado exitosamente.');
      loadData();
    } catch (e) {
      setError(e.message || 'Error al solicitar el reintento.');
    } finally {
      setRetryingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="notifications-dropdown-panel"
      role="region"
      aria-label="Panel de Notificaciones del Sistema"
    >
      {/* Encabezado del Dropdown */}
      <div className="notifications-dropdown-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
            <Icon name="bell" size={18} />
          </span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Avisos y Operaciones
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-action-icon"
            onClick={loadData}
            title="Actualizar datos"
            disabled={loading}
            style={{ width: '28px', height: '28px', color: 'var(--color-text-secondary)' }}
          >
            <Icon name="refresh" size={14} />
          </button>
          <button
            type="button"
            className="btn-action-icon"
            onClick={onClose}
            aria-label="Cerrar notificaciones"
            title="Cerrar notificaciones"
            style={{ width: '28px', height: '28px' }}
          >
            <Icon name="x-circle" size={16} />
          </button>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="notifications-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'vencimientos'}
          className={`notifications-tab-btn ${activeTab === 'vencimientos' ? 'active' : ''}`}
          onClick={() => setActiveTab('vencimientos')}
        >
          <span>Vencimientos</span>
          {alerts.length > 0 && <span className="notifications-tab-badge">{alerts.length}</span>}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'recordatorios'}
          className={`notifications-tab-btn ${activeTab === 'recordatorios' ? 'active' : ''}`}
          onClick={() => setActiveTab('recordatorios')}
        >
          <span>Recordatorios</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'comunicaciones'}
          className={`notifications-tab-btn ${activeTab === 'comunicaciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('comunicaciones')}
        >
          <span>Comunicaciones</span>
        </button>
      </div>

      {/* Alertas inline de error o acción */}
      {error && (
        <div style={{ padding: '8px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '12px', borderBottom: '1px solid var(--color-danger-border)' }}>
          {error}
        </div>
      )}
      {actionNotice && (
        <div style={{ padding: '8px 14px', background: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: '12px', borderBottom: '1px solid var(--color-success-border)' }}>
          {actionNotice}
        </div>
      )}

      {/* Cuerpo del Panel */}
      <div className="notifications-body" role="tabpanel">
        {loading ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: '13px' }}>Consultando registros en vivo...</span>
          </div>
        ) : activeTab === 'vencimientos' ? (
          /* TAB 1: VENCIMIENTOS */
          alerts.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <span style={{ color: 'var(--color-success)', display: 'block', marginBottom: '8px' }}>
                <Icon name="check-circle" size={24} />
              </span>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Todas las membresías al día
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                No hay alertas de socios por vencer o vencidos actualmente.
              </p>
            </div>
          ) : (
            alerts.map((item) => {
              const isUnread = !seenIds.has(item.clientId);
              const isExpired = item.state === 'VENCIDO';
              return (
                <div
                  key={item.clientId}
                  className={`notification-card ${isUnread ? 'unread' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                        {item.clientName}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '1px' }}>
                        DNI: {item.documentNumber || '—'} · Plan: {item.planName || 'General'}
                      </span>
                    </div>
                    <Badge variant={isExpired ? 'danger' : 'warning'} style={{ fontSize: '10px' }}>
                      {isExpired ? 'VENCIDO' : `Vence en ${item.daysRemaining} d`}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span>Límite: {item.lastIncludedDate ? dateLabel(item.lastIncludedDate) : 'Sin fecha'}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px', minHeight: '26px' }}
                      onClick={() => {
                        onClose();
                        onNavigate?.('clients');
                      }}
                    >
                      Ver Socio
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : activeTab === 'recordatorios' ? (
          /* TAB 2: RECORDATORIOS */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="notification-card" style={{ background: 'var(--color-surface-panel)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Servicio Automático:</span>
                <Badge variant={reminderConfig?.enabled ? 'gold' : 'neutral'}>
                  {reminderConfig?.enabled ? 'HABILITADO' : 'INACTIVO'}
                </Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
                <div style={{ padding: '8px', background: 'var(--color-surface-input)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Anticipación</span>
                  <strong>{reminderConfig?.daysBeforeExpiry ?? 7} días antes</strong>
                </div>
                <div style={{ padding: '8px', background: 'var(--color-surface-input)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>Hora de Corte</span>
                  <strong>{String(reminderConfig?.evaluationHourLima ?? 9).padStart(2, '0')}:00 (Lima)</strong>
                </div>
              </div>

              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Canal de Despacho: <strong style={{ color: 'var(--color-gold)' }}>WhatsApp Business (Meta API)</strong>
              </div>
            </div>

            {isAdmin() && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button
                  variant="primary"
                  onClick={handleEvaluateNow}
                  disabled={evaluating}
                  style={{ width: '100%', minHeight: '36px', fontSize: '12px' }}
                >
                  <Icon name="refresh" size={14} />
                  <span>{evaluating ? 'Evaluando corte...' : 'Ejecutar Corte Manual Ahora'}</span>
                </Button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', width: '100%' }}
                  onClick={() => {
                    onClose();
                    onNavigate?.('settings');
                  }}
                >
                  Ir a Ajustes de Recordatorios en Configuración
                </button>
              </div>
            )}
          </div>
        ) : (
          /* TAB 3: COMUNICACIONES */
          commsItems.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
                <Icon name="message-circle" size={24} />
              </span>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Sin envíos recientes
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Los avisos generados por recordatorios figurarán aquí.
              </p>
            </div>
          ) : (
            commsItems.map((item) => {
              const isUnread = !seenIds.has(item.id);
              const isFailed = item.status === 'FALLIDO';
              return (
                <div key={item.id} className={`notification-card ${isUnread ? 'unread' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                        {item.clientName || 'Socio GYM VIP'}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Destino: {item.recipientMasked} · {item.channel}
                      </span>
                    </div>
                    <Badge variant={isFailed ? 'danger' : item.status === 'ENTREGADO' || item.status === 'LEIDO' ? 'gold' : 'neutral'} style={{ fontSize: '10px' }}>
                      {item.status}
                    </Badge>
                  </div>

                  {item.errorMessage && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--color-danger)', lineHeight: 1.3 }}>
                      {item.errorMessage}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                    </span>
                    {isFailed && isAdmin() && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '10px', padding: '2px 8px', minHeight: '24px' }}
                        disabled={retryingId === item.id}
                        onClick={() => handleRetryComms(item.id)}
                      >
                        {retryingId === item.id ? 'Reintentando...' : 'Reintentar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Pie del Dropdown */}
      <div className="notifications-footer">
        <button
          type="button"
          onClick={markAllAsSeen}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0 }}
        >
          Marcar todo como visto
        </button>

        {activeTab === 'comunicaciones' && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate?.('communications');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Ver historial completo →
          </button>
        )}
      </div>
    </div>
  );
}

export default NotificationsModal;
