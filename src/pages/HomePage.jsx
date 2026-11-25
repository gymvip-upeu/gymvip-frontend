// ==============================================================================
// GYM VIP — Pantalla: HomePage (Dashboard Operativo Diario Luxury Dark & Gold)
// 5 KPIs ejecutivos con micro-gráficos uniformes + Pulso Operativo del Día
// Analítica histórica y gráficos detallados centralizados en Reportes
// ==============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchClients } from '../services/clientService';
import { fetchPlans } from '../services/planService';
import { listCoverage } from '../api/jorgeApi';
import { fetchDashboardMetrics } from '../api/dashboardApi';
import { listAdminOrdersApi } from '../api/supplementOrderApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icons';
import { Alert } from '../components/common/Alert';
import { LoadingState, EmptyState } from '../components/feedback/LoadingState';
import { GoldSkeleton } from '../components/common/GoldSkeleton';
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

function MiniDonut({ ratio = 0, color = '#D4AF37', label = '' }) {
  const pct = Math.max(0, Math.min(1, ratio));
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-label={label} role="img" style={{ flexShrink: 0 }}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${pct * c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}

export default function HomePage({ onNavigate }) {
  const { token, user, isBusinessExecutive, isRecepcion } = useAuth();
  const isExecutive = isBusinessExecutive();
  const canViewFinancials = isExecutive || user?.roles?.includes('AUDITOR');

  const [metrics, setMetrics] = useState({
    totalClients: null,
    activePlans: null,
    totalAlerts: null,
    todayAttendance: 0,
    pendingOrders: 0,
    membershipsByStatus: {},
    membershipsByPlan: [],
    expirationsByInterval: {},
    recentAttendance7Days: [],
    financialSummary: null,
  });

  const [expiringMembers, setExpiringMembers] = useState([]);
  const [pendingOrdersList, setPendingOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    setError('');

    try {
      const [dashboardMetrics, clientsData, plansData, ordersRes] = await Promise.all([
        fetchDashboardMetrics(token).catch(() => null),
        fetchClients('', 0, 1, token).catch(() => ({ totalElements: 0 })),
        fetchPlans('ACTIVO', token).catch(() => []),
        isExecutive || isRecepcion()
          ? listAdminOrdersApi({ status: 'PAGADO_POR_VERIFICAR', page: 0, size: 4 }, token).catch(() => ({ content: [] }))
          : Promise.resolve({ content: [] }),
      ]);

      let alertsCount = dashboardMetrics?.totalAlerts ?? 0;
      let alertsList = [];

      if (isExecutive || isRecepcion()) {
        try {
          const coverageData = await listCoverage({ state: 'ALERTAS', page: 0, size: 8 }, token);
          if (!dashboardMetrics) {
            alertsCount = coverageData?.totalElements ?? 0;
          }
          const items = Array.isArray(coverageData?.content) ? [...coverageData.content] : [];
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
          totalClients: dashboardMetrics?.totalClients ?? clientsData.totalElements ?? 0,
          activePlans: dashboardMetrics?.activePlans ?? plansData.length,
          totalAlerts: alertsCount,
          todayAttendance: dashboardMetrics?.todayAttendance ?? 0,
          pendingOrders: dashboardMetrics?.pendingOrders ?? 0,
          membershipsByStatus: dashboardMetrics?.membershipsByStatus ?? {},
          membershipsByPlan: dashboardMetrics?.membershipsByPlan ?? [],
          expirationsByInterval: dashboardMetrics?.expirationsByInterval ?? {},
          recentAttendance7Days: dashboardMetrics?.recentAttendance7Days ?? [],
          financialSummary: dashboardMetrics?.financialSummary ?? null,
        });
        setExpiringMembers(alertsList);
        const oList = Array.isArray(ordersRes?.content) ? ordersRes.content : Array.isArray(ordersRes) ? ordersRes : [];
        setPendingOrdersList(oList);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
        setCoverageLoading(false);
      }
    }
  }, [isExecutive, isRecepcion, token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getUrgencyBadge = (daysRemaining, state) => {
    if (state === 'VENCIDO' || daysRemaining < 0) return <Badge variant="danger">Vencida</Badge>;
    if (daysRemaining === 0) return <Badge variant="warning">Vence Hoy</Badge>;
    if (daysRemaining === 1) return <Badge variant="warning">Vence Mañana</Badge>;
    if (daysRemaining <= 7) return <Badge variant="gold">{`En ${daysRemaining} días`}</Badge>;
    return <Badge variant="neutral">{`En ${daysRemaining} días`}</Badge>;
  };

  const attendanceDays = useMemo(
    () =>
      metrics.recentAttendance7Days.length > 0
        ? metrics.recentAttendance7Days.map((d) => d.dayName)
        : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    [metrics.recentAttendance7Days]
  );

  const attendanceCounts = useMemo(
    () =>
      metrics.recentAttendance7Days.length > 0
        ? metrics.recentAttendance7Days.map((d) => d.count)
        : [0, 0, 0, 0, 0, 0, 0],
    [metrics.recentAttendance7Days]
  );

  const activeClientsRatio = metrics.totalClients
    ? (metrics.membershipsByStatus?.VIGENTE ?? 0) / metrics.totalClients
    : 0;
  const riskRatio = metrics.totalClients ? (metrics.totalAlerts || 0) / metrics.totalClients : 0;

  return (
    <div className="home-page-container">
      <div
        className="hero-banner"
        style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '24px',
          border: '1px solid var(--color-border)',
          background: 'linear-gradient(135deg, rgba(11, 19, 32, 0.95) 0%, rgba(17, 24, 39, 0.9) 100%)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${athleteImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 25%',
            opacity: 0.12,
            filter: 'grayscale(40%) contrast(120%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Badge variant="gold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                VIP CENTER FIT - SEDE CENTRAL
              </Badge>
              <span style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Resumen Operativo del Día
              </span>
            </div>
            <h1 style={{ fontSize: '25px', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
              Bienvenido, {user?.email || 'Colaborador'}
            </h1>
            <p style={{ color: '#cbd5e1', margin: 0, fontSize: '14px', maxWidth: '640px' }}>
              Pulso diario de renovaciones, flujo de ingreso y recaudación del club en tiempo real.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => onNavigate('clients')} style={{ fontSize: '13px' }}>
              <Icon name="users" size={15} />
              <span>Directorio</span>
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('memberships')} style={{ fontSize: '13px' }}>
              <Icon name="credit-card" size={15} />
              <span>Cobros / Membresías</span>
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('verification')} style={{ fontSize: '13px' }}>
              <Icon name="shield-check" size={15} color="var(--color-success)" />
              <span>Verificar Acceso</span>
            </Button>
          </div>
        </div>
      </div>

      {/* NIVEL 1: 5 KPIs con micro-visualizaciones uniformes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Miembros Registrados
              </span>
              <MiniDonut ratio={activeClientsRatio} color="#D4AF37" label="Porcentaje con plan vigente" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 6px 0' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-gold)' }}>
                {loading ? <GoldSkeleton width="70px" height="32px" /> : metrics.totalClients}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>en base de datos</span>
            </div>
            <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--color-gold)' }}>● Vig: <b>{metrics.membershipsByStatus?.VIGENTE ?? 0}</b></span>
                <span style={{ color: 'var(--color-danger)' }}>● Venc: <b>{metrics.membershipsByStatus?.VENCIDO ?? 0}</b></span>
              </div>
              <div style={{ height: '5px', width: '100%', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${activeClientsRatio * 100}%`, background: '#D4AF37' }} />
                <div style={{ width: `${metrics.totalClients ? ((metrics.membershipsByStatus?.VENCIDO ?? 0) / metrics.totalClients) * 100 : 0}%`, background: '#EF4444' }} />
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('clients')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Directorio</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Planes en Catálogo
              </span>
              <MiniDonut ratio={metrics.membershipsByPlan.length ? 0.8 : 0.25} color="#3B82F6" label="Ocupación de planes" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 6px 0' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-gold)' }}>
                {loading ? <GoldSkeleton width="55px" height="32px" /> : metrics.activePlans}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>tarifas activas</span>
            </div>
            <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
                <span>Top Plan:</span>
                <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                  {metrics.membershipsByPlan?.[0]?.planName || 'Catálogo Oficial'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                <span>Afiliados vigentes:</span>
                <b style={{ color: 'var(--color-text-primary)' }}>
                  {metrics.membershipsByPlan.reduce((acc, p) => acc + p.memberCount, 0)}
                </b>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('plans')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Planes</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Alertas de Vencimiento
              </span>
              <MiniDonut ratio={riskRatio} color="#F59E0B" label="Socios por vencer o vencidos" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 6px 0' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-warning)' }}>
                {loading ? <GoldSkeleton width="55px" height="32px" /> : metrics.totalAlerts}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>socios por atender</span>
            </div>
            <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--color-danger)' }}>Venc: <b>{metrics.expirationsByInterval?.Vencidas ?? 0}</b></span>
                <span style={{ color: 'var(--color-warning)' }}>1-7d: <b>{metrics.expirationsByInterval?.['1 a 7 días'] ?? 0}</b></span>
                <span style={{ color: 'var(--color-text-muted)' }}>8-30d: <b>{metrics.expirationsByInterval?.['8 a 30 días'] ?? 0}</b></span>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('coverage')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Vigencias</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Asistencia Hoy
              </span>
              <span style={{ color: 'var(--color-success)' }} aria-hidden="true">
                <Icon name="check-circle" size={20} />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 6px 0' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-success)' }}>
                {loading ? '...' : metrics.todayAttendance}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>check-ins validados</span>
            </div>
            <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '22px', gap: '3px' }}>
                {attendanceCounts.map((cnt, i) => {
                  const max = Math.max(...attendanceCounts, 1);
                  const h = Math.max(4, Math.round((cnt / max) * 20));
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${h}px`,
                          backgroundColor: i === 6 ? '#10B981' : 'rgba(16, 185, 129, 0.45)',
                          borderRadius: '2px',
                        }}
                        title={`${attendanceDays[i]}: ${cnt}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                <span>7d atrás</span>
                <span>Hoy</span>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('attendance')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Agenda de Asistencias</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {canViewFinancials ? (
          <div className="card kpi-card" style={{ padding: '18px 20px', border: '1px solid var(--color-gold-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  Recaudación Mes (PEN)
                </span>
                <MiniDonut
                  ratio={metrics.financialSummary?.monthlyRevenuePen ? Math.min(1, (metrics.financialSummary?.todayRevenuePen ?? 0) / metrics.financialSummary.monthlyRevenuePen + 0.15) : 0.1}
                  color="#10B981"
                  label="Proporción recaudada hoy"
                />
              </div>
              <div style={{ fontSize: '27px', fontWeight: 800, color: 'var(--color-gold)', margin: '4px 0 6px 0' }}>
                {loading
                  ? '...'
                  : `S/ ${(metrics.financialSummary?.monthlyRevenuePen ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
              </div>
              <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Cobrado hoy:</span>
                  <b style={{ color: 'var(--color-success)' }}>
                    S/ {(metrics.financialSummary?.todayRevenuePen ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </b>
                </div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => onNavigate('reports')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
              <span>Ver Reportes</span>
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>
        ) : (
          <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  Pedidos por Despachar
                </span>
                <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                  <Icon name="package" size={18} />
                </span>
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '6px 0 4px 0' }}>
                {loading ? '...' : metrics.pendingOrders}
              </div>
              <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Suplementos en cola de retiro QR</span>
              </div>
            </div>
            <Button variant="secondary" onClick={() => onNavigate('supplementOrders')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
              <span>Bandeja Pedidos</span>
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>
        )}
      </div>

      {/* NIVEL 2: PULSO OPERATIVO DIARIO EN 2 COLUMNAS */}
      {(isExecutive || isRecepcion()) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Miembros Próximos a Vencer (Atención Hoy)
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '3px 0 0 0' }}>
                  Ordenados cronológicamente para renovación en mostrador.
                </p>
              </div>
              <Button variant="secondary" onClick={() => onNavigate('coverage')} style={{ fontSize: '12px', minHeight: '32px' }}>
                <span>Ver Vigencias</span>
                <Icon name="chevron-right" size={13} />
              </Button>
            </div>

            {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}

            {coverageLoading ? (
              <LoadingState message="Cargando alertas de vencimiento…" />
            ) : expiringMembers.length === 0 ? (
              <EmptyState
                title="Sin Alertas Críticas"
                description="No hay membresías por vencer o vencidas en este momento."
              />
            ) : (
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Socio</th>
                      <th>Plan</th>
                      <th>Límite</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringMembers.map((member) => (
                      <tr key={member.clientId}>
                        <td>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '13px' }}>{member.fullName}</strong>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--color-gold)' }}>{member.planName || '—'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {dateLabel(member.lastIncludedDate)}
                        </td>
                        <td>{getUrgencyBadge(member.daysRemaining, member.state)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="primary"
                            style={{ fontSize: '11px', minHeight: '28px', padding: '0 10px' }}
                            onClick={() => setSelectedClientId(member.clientId)}
                          >
                            Renovar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    Pedidos QR y Despacho en Mostrador
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '3px 0 0 0' }}>
                    Órdenes pendientes de verificación de pago o entrega.
                  </p>
                </div>
                <Button variant="secondary" onClick={() => onNavigate('supplementOrders')} style={{ fontSize: '12px', minHeight: '32px' }}>
                  <span>Abrir Bandeja</span>
                  <Icon name="chevron-right" size={13} />
                </Button>
              </div>

              {pendingOrdersList.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--color-bg-elevated)', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  Sin comprobantes Yape/Plin por verificar en este momento.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {pendingOrdersList.map((ord) => (
                    <div
                      key={ord.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '13px' }}>
                          {ord.orderNumber} · {ord.clientName}
                        </strong>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {ord.paymentMethod} · S/ {Number(ord.totalPen || 0).toFixed(2)}
                        </span>
                      </div>
                      <Badge variant="gold" style={{ fontSize: '10px' }}>POR VERIFICAR</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canViewFinancials && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-gold-border)',
                  background: 'rgba(212,175,55,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--color-gold)', display: 'block' }}>
                    Analítica Gerencial Completa en Reportes
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Consulta gráficos de pastel, popularidad de planes, afluencia semanal e ingresos por método de pago.
                  </span>
                </div>
                <Button variant="primary" onClick={() => onNavigate('reports')} style={{ fontSize: '12px', minHeight: '34px' }}>
                  Ir a Reportes →
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedClientId && (
        <ClientManageModal
          clientId={selectedClientId}
          token={token}
          onClose={() => setSelectedClientId(null)}
          onUpdated={loadDashboardData}
        />
      )}
    </div>
  );
}
