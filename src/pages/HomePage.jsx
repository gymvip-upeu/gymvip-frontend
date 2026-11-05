// ==============================================================================
// GYM VIP — Pantalla: HomePage (Panel de Control Principal Luxury - OBS-UX-04)
// Dashboard ejecutivo con resumen operativo y lista de vencimientos urgentes
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchClients } from '../services/clientService';
import { fetchPlans } from '../services/planService';
import { listCoverage } from '../api/jorgeApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icons';
import { Alert } from '../components/common/Alert';
import { LoadingState, EmptyState } from '../components/feedback/LoadingState';
import ClientManageModal from '../components/modals/ClientManageModal';
import athleteImg from '../assets/hero-athlete.jpg';

const dateLabel = (value) => {
  if (!value) return '—';
  try {
    return new Date(`${value}T00:00:00Z`).toLocaleDateString('es-PE', { timeZone: 'UTC' });
  } catch {
    return value;
  }
};

export default function HomePage({ onNavigate }) {
  const { token, user, isAdmin, isRecepcion } = useAuth();

  const [metrics, setMetrics] = useState({
    totalClients: null,
    activePlans: null,
    totalAlerts: null,
  });

  const [expiringMembers, setExpiringMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    setError('');

    try {
      const [clientsData, plansData] = await Promise.all([
        fetchClients('', 0, 1, token).catch(() => ({ totalElements: 0 })),
        fetchPlans('ACTIVO', token).catch(() => []),
      ]);

      let alertsData = null;
      let alertsCount = 0;
      let alertsList = [];

      if (isAdmin() || isRecepcion()) {
        try {
          alertsData = await listCoverage({ state: 'ALERTAS', page: 0, size: 10 }, token);
          alertsCount = alertsData?.totalElements ?? 0;
          const items = Array.isArray(alertsData?.content) ? [...alertsData.content] : [];
          // Ordenar por fecha más urgente (lastIncludedDate ascendente)
          items.sort((a, b) => {
            const dateA = a.lastIncludedDate ? new Date(`${a.lastIncludedDate}T00:00:00Z`).getTime() : Infinity;
            const dateB = b.lastIncludedDate ? new Date(`${b.lastIncludedDate}T00:00:00Z`).getTime() : Infinity;
            return dateA - dateB;
          });
          alertsList = items.slice(0, 6);
        } catch (e) {
          setError(e.message || 'No se pudieron consultar las alertas de vencimiento.');
        }
      }

      if (isMounted) {
        setMetrics({
          totalClients: clientsData.totalElements ?? 0,
          activePlans: plansData.length,
          totalAlerts: alertsCount,
        });
        setExpiringMembers(alertsList);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
        setCoverageLoading(false);
      }
    }
  }, [isAdmin, isRecepcion, token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getUrgencyBadge = (daysRemaining, state) => {
    if (state === 'VENCIDO' || daysRemaining < 0) {
      return <Badge variant="danger">Vencida</Badge>;
    }
    if (daysRemaining === 0) {
      return <Badge variant="warning">Vence Hoy</Badge>;
    }
    if (daysRemaining === 1) {
      return <Badge variant="warning">Vence Mañana</Badge>;
    }
    if (daysRemaining <= 7) {
      return <Badge variant="gold">{`En ${daysRemaining} días`}</Badge>;
    }
    return <Badge variant="neutral">{`En ${daysRemaining} días`}</Badge>;
  };

  return (
    <div className="home-dashboard" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      {/* Banner Ejecutivo Compacto (OBS-UX-04) */}
      <div
        className="card home-hero-banner"
        style={{
          padding: '24px 28px',
          marginBottom: '24px',
          backgroundImage: `linear-gradient(135deg, rgba(11, 13, 18, 0.92) 0%, rgba(21, 25, 34, 0.96) 60%, rgba(212, 175, 55, 0.12) 100%), url(${athleteImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          border: '1px solid var(--color-gold-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Badge variant="gold">VIP CENTER FIT · SEDE CENTRAL</Badge>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                LUXURY FITNESS
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '2px 0 6px 0', color: 'var(--color-text-primary)' }}>
              Bienvenido, {user?.email}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: 0, maxWidth: '640px' }}>
              Supervisión de membresías, atención prioritaria de renovaciones y control de acceso.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => onNavigate('clients')} style={{ minHeight: '38px', fontSize: '13px' }}>
              <Icon name="users" size={15} />
              <span>Directorio</span>
            </Button>
            {(isAdmin() || isRecepcion()) && (
              <>
                <Button variant="secondary" onClick={() => onNavigate('memberships')} style={{ minHeight: '38px', fontSize: '13px' }}>
                  <Icon name="credit-card" size={15} color="var(--color-gold)" />
                  <span>Cobros / Operaciones</span>
                </Button>
                <Button variant="secondary" onClick={() => onNavigate('verification')} style={{ minHeight: '38px', fontSize: '13px' }}>
                  <Icon name="check-circle" size={15} color="var(--color-success)" />
                  <span>Verificar Acceso</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Ejecutivas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        {/* KPI 1: Miembros Registrados */}
        <div className="card kpi-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Miembros Registrados
            </span>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="users" size={20} />
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-gold)', margin: '8px 0 4px 0' }}>
            {loading ? '...' : metrics.totalClients}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
            Directorio con código determinista
          </p>
          <Button
            variant="secondary"
            onClick={() => onNavigate('clients')}
            style={{ width: '100%', fontSize: '12px', minHeight: '34px' }}
          >
            <span>Ver Directorio</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 2: Planes Activos */}
        <div className="card kpi-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Planes en Catálogo
            </span>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="tag" size={20} />
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-gold)', margin: '8px 0 4px 0' }}>
            {loading ? '...' : metrics.activePlans}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
            Tarifario oficial vigente en Soles
          </p>
          <Button
            variant="secondary"
            onClick={() => onNavigate('plans')}
            style={{ width: '100%', fontSize: '12px', minHeight: '34px' }}
          >
            <span>Ver Planes</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 3: Alertas de Vencimiento */}
        <div className="card kpi-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Alertas de Vencimiento
            </span>
            <span style={{ color: 'var(--color-warning)' }} aria-hidden="true">
              <Icon name="calendar" size={20} />
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-warning)', margin: '8px 0 4px 0' }}>
            {loading ? '...' : metrics.totalAlerts}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
            Socios por vencer o vencidos
          </p>
          <Button
            variant="secondary"
            onClick={() => onNavigate('coverage')}
            style={{ width: '100%', fontSize: '12px', minHeight: '34px' }}
          >
            <span>Ver Vigencias y Alertas</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>
      </div>

      {/* Sección Clave OBS-UX-04: Miembros Próximos a Vencer (Atención Prioritaria) */}
      {(isAdmin() || isRecepcion()) && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                  <Icon name="bell" size={18} />
                </span>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Miembros Próximos a Vencer (Atención Prioritaria)
                </h2>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Muestra ordenada cronológicamente por vencimiento más próximo para gestión de cobranza y renovación.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => onNavigate('coverage')}
              style={{ fontSize: '12px', minHeight: '34px' }}
            >
              <span>Ver Vista Completa de Vigencias</span>
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>

          {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}

          {coverageLoading ? (
            <LoadingState message="Cargando alertas de vencimiento prioritarias..." />
          ) : expiringMembers.length === 0 ? (
            <EmptyState
              title="Sin Alertas Críticas"
              description="No hay membresías por vencer o vencidas en este momento. Todas las coberturas registradas se encuentran al día."
            />
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Documento / Código</th>
                    <th>Plan Actual</th>
                    <th>Último Día Válido</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringMembers.map((member) => (
                    <tr key={member.clientId}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
                          {member.fullName}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          {member.memberCode || member.document || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-gold)' }}>
                          {member.planName || 'Plan no especificado'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {dateLabel(member.lastIncludedDate)}
                        </span>
                      </td>
                      <td>
                        {getUrgencyBadge(member.daysRemaining, member.state)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="primary"
                            style={{ fontSize: '12px', minHeight: '32px', padding: '0 12px' }}
                            onClick={() => setSelectedClientId(member.clientId)}
                          >
                            <Icon name="eye" size={13} />
                            <span>Ver Ficha / Renovar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Ficha Rápida / Renovación en Pantalla de Inicio */}
      {selectedClientId && (
        <ClientManageModal
          clientId={selectedClientId}
          token={token}
          onClose={() => setSelectedClientId(null)}
          onUpdated={() => {
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
