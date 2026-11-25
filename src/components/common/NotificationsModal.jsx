// ==============================================================================
// GYM VIP — Centro Unificado de Alertas Prioritarias (Campana Header)
// Consolidado en una lista accionable única (Vencimientos + Pedidos por Verificar)
// ==============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from './Icons';
import { Badge } from './Badge';
import { listCoverage } from '../../api/jorgeApi';
import { listAdminOrdersApi } from '../../api/supplementOrderApi';
import { dateLabel } from '../members/memberUtils';

export function NotificationsModal({ isOpen, onClose, onNavigate }) {
  const panelRef = useRef(null);
  const { token, user, isBusinessExecutive, isRecepcion } = useAuth();
  const canOperate = isBusinessExecutive() || isRecepcion();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedItems, setFeedItems] = useState([]);

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
    feedItems.forEach((item) => item.id && allIds.add(item.id));
    setSeenIds(allIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const loadData = useCallback(async () => {
    if (!token || !canOperate) return;
    setLoading(true);
    setError('');
    try {
      const [coverageRes, ordersRes] = await Promise.all([
        listCoverage({ state: 'ALERTAS', page: 0, size: 6 }, token).catch(() => ({ content: [] })),
        listAdminOrdersApi({ status: 'PAGADO_POR_VERIFICAR', page: 0, size: 5 }, token).catch(() => ({ content: [] })),
      ]);

      const coverageAlerts = (Array.isArray(coverageRes?.content) ? coverageRes.content : []).map((item) => ({
        id: `cov_${item.clientId}`,
        kind: 'COVERAGE',
        title: item.clientName || item.fullName,
        subtitle: `DNI: ${item.documentNumber || '—'} · Plan: ${item.planName || 'General'}`,
        badgeLabel: item.state === 'VENCIDO' ? 'VENCIDO' : `Vence en ${item.daysRemaining}d`,
        badgeVariant: item.state === 'VENCIDO' ? 'danger' : 'warning',
        detail: `Límite: ${item.lastIncludedDate ? dateLabel(item.lastIncludedDate) : 'Sin fecha'}`,
        targetView: 'coverage',
        actionLabel: 'Gestionar',
      }));

      const orderList = Array.isArray(ordersRes?.content) ? ordersRes.content : Array.isArray(ordersRes) ? ordersRes : [];
      const orderAlerts = orderList.map((ord) => ({
        id: `ord_${ord.id}`,
        kind: 'ORDER',
        title: `Pedido ${ord.orderNumber} por verificar`,
        subtitle: `${ord.clientName} · ${ord.paymentMethod}`,
        badgeLabel: 'PAGO QR',
        badgeVariant: 'gold',
        detail: `Total S/ ${Number(ord.totalPen || 0).toFixed(2)}`,
        targetView: 'supplementOrders',
        actionLabel: 'Revisar Pago',
      }));

      setFeedItems([...orderAlerts, ...coverageAlerts]);
    } catch (e) {
      setError(e.message || 'No fue posible consultar las alertas operativas.');
    } finally {
      setLoading(false);
    }
  }, [token, canOperate]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

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

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="notifications-dropdown-panel"
      role="region"
      aria-label="Alertas Prioritarias de Hoy"
    >
      <div className="notifications-dropdown-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
            <Icon name="bell" size={18} />
          </span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Alertas Operativas
          </h3>
          {feedItems.length > 0 && <Badge variant="gold" style={{ fontSize: '10px' }}>{feedItems.length}</Badge>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-action-icon"
            onClick={loadData}
            title="Actualizar alertas"
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
            style={{ width: '28px', height: '28px' }}
          >
            <Icon name="x-circle" size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 14px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: '12px' }}>
          {error}
        </div>
      )}

      <div className="notifications-body">
        {loading ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Consultando alertas de hoy…
          </div>
        ) : !canOperate ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
            Las alertas operativas de recepción y renovaciones están disponibles para personal operativo.
          </div>
        ) : feedItems.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center' }}>
            <span style={{ color: 'var(--color-success)', display: 'block', marginBottom: '8px' }}>
              <Icon name="check-circle" size={24} />
            </span>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Operación al día
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Sin vencimientos críticos ni pagos Yape/Plin pendientes de verificación.
            </p>
          </div>
        ) : (
          feedItems.map((item) => {
            const isUnread = !seenIds.has(item.id);
            return (
              <div key={item.id} className={`notification-card ${isUnread ? 'unread' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>{item.title}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
                      {item.subtitle}
                    </span>
                  </div>
                  <Badge variant={item.badgeVariant} style={{ fontSize: '10px', flexShrink: 0 }}>
                    {item.badgeLabel}
                  </Badge>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <span>{item.detail}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px', minHeight: '26px' }}
                    onClick={() => {
                      onClose();
                      onNavigate?.(item.targetView);
                    }}
                  >
                    {item.actionLabel}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="notifications-footer">
        <button
          type="button"
          onClick={markAllAsSeen}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0 }}
        >
          Marcar todo como visto
        </button>

        {canOperate && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate?.('coverage');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Ver Vigencias →
          </button>
        )}
      </div>
    </div>
  );
}

export default NotificationsModal;
