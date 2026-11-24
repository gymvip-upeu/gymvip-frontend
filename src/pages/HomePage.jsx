// ==============================================================================
// GYM VIP — Pantalla: HomePage (Panel de Control Principal Luxury - Fase 2 & 4)
// Dashboard ejecutivo, visual y analítico con micro-gráficos interactivos en KPIs,
// aislamiento RBAC y acciones de exportación (PNG, Portapapeles, CSV, Tabla)
// ==============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchClients } from '../services/clientService';
import { fetchPlans } from '../services/planService';
import { listCoverage } from '../api/jorgeApi';
import { fetchDashboardMetrics } from '../api/dashboardApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icons';
import { Alert } from '../components/common/Alert';
import { LoadingState, EmptyState } from '../components/feedback/LoadingState';
import { AnalyticsChartCard } from '../components/common/AnalyticsChartCard';
import { GoldSkeleton } from '../components/common/GoldSkeleton';
import ClientManageModal from '../components/modals/ClientManageModal';
import athleteImg from '../assets/hero-athlete.jpg';

import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';

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
  const canViewFinancials = isAdmin() || user?.roles?.includes('AUDITOR');

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
    ordersByStatus: {},
    financialSummary: null,
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
      const [dashboardMetrics, clientsData, plansData] = await Promise.all([
        fetchDashboardMetrics(token).catch(() => null),
        fetchClients('', 0, 1, token).catch(() => ({ totalElements: 0 })),
        fetchPlans('ACTIVO', token).catch(() => []),
      ]);

      let alertsCount = dashboardMetrics?.totalAlerts ?? 0;
      let alertsList = [];

      if (isAdmin() || isRecepcion()) {
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
          ordersByStatus: dashboardMetrics?.ordersByStatus ?? {},
          financialSummary: dashboardMetrics?.financialSummary ?? null,
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

  // Preparación de datos para Donut de Membresías
  const statusPieData = useMemo(() => [
    { id: 0, value: metrics.membershipsByStatus?.VIGENTE ?? 0, label: 'Vigentes', color: '#D4AF37' },
    { id: 1, value: metrics.membershipsByStatus?.VENCIDO ?? 0, label: 'Vencidas', color: '#EF4444' },
    { id: 2, value: metrics.membershipsByStatus?.CONGELADO ?? 0, label: 'Congeladas', color: '#3B82F6' },
    { id: 3, value: metrics.membershipsByStatus?.CANCELADO ?? 0, label: 'Canceladas', color: '#64748B' },
  ], [metrics.membershipsByStatus]);

  const totalStatusCount = statusPieData.reduce((acc, curr) => acc + curr.value, 0);
  const displayStatusPie = totalStatusCount === 0
    ? [{ id: 99, value: 1, label: 'Sin Datos', color: '#334155' }]
    : statusPieData.filter(d => d.value > 0);

  // Tablas de datos para exportación CSV de cada gráfico
  const membershipStatusTableData = useMemo(() => ({
    headers: ['Estado de Membresía', 'Cantidad de Socios', 'Porcentaje'],
    rows: statusPieData.map((d) => [
      d.label,
      d.value,
      totalStatusCount > 0 ? `${Math.round((d.value / totalStatusCount) * 100)}%` : '0%'
    ])
  }), [statusPieData, totalStatusCount]);

  const plansTableData = useMemo(() => ({
    headers: ['Plan Comercial', 'Socios Afiliados'],
    rows: metrics.membershipsByPlan.map(p => [p.planName, p.memberCount])
  }), [metrics.membershipsByPlan]);

  const attendanceDays = useMemo(() => (
    metrics.recentAttendance7Days.length > 0
      ? metrics.recentAttendance7Days.map(d => d.dayName)
      : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  ), [metrics.recentAttendance7Days]);

  const attendanceCounts = useMemo(() => (
    metrics.recentAttendance7Days.length > 0
      ? metrics.recentAttendance7Days.map(d => d.count)
      : [0, 0, 0, 0, 0, 0, 0]
  ), [metrics.recentAttendance7Days]);

  const attendanceTableData = useMemo(() => ({
    headers: ['Día de la Semana', 'Fecha (America/Lima)', 'Marcaciones en Torniquete'],
    rows: metrics.recentAttendance7Days.map(d => [d.dayName, d.date, d.count])
  }), [metrics.recentAttendance7Days]);

  const expirationLabels = useMemo(() => Object.keys(metrics.expirationsByInterval || {}), [metrics.expirationsByInterval]);
  const expirationValues = useMemo(() => Object.values(metrics.expirationsByInterval || {}), [metrics.expirationsByInterval]);

  const expirationTableData = useMemo(() => ({
    headers: ['Intervalo de Vencimiento', 'Cantidad de Socios'],
    rows: expirationLabels.map((label, idx) => [label, expirationValues[idx]])
  }), [expirationLabels, expirationValues]);

  // Datos para Donut de Métodos de Pago
  const paymentMethodsPie = useMemo(() => {
    if (!metrics.financialSummary?.revenueByMethod) return [];
    return Object.entries(metrics.financialSummary.revenueByMethod).map(([method, amount], idx) => {
      const colors = ['#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
      return {
        id: idx,
        value: Number(amount),
        label: method,
        color: colors[idx % colors.length],
      };
    }).filter(d => d.value > 0);
  }, [metrics.financialSummary]);

  const financialsTableData = useMemo(() => ({
    headers: ['Método de Pago', 'Monto Recaudado (PEN)'],
    rows: paymentMethodsPie.map(p => [p.label, `S/ ${p.value.toFixed(2)}`])
  }), [paymentMethodsPie]);

  return (
    <div className="home-page-container">
      {/* Banner Superior de Bienvenida */}
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

        <div style={{ position: 'relative', zIndex: 1, padding: '26px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Badge variant="gold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>VIP CENTER FIT - SEDE CENTRAL</Badge>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Luxury Fitness
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
              Bienvenido, {user?.email || 'Administrador'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '14px', maxWidth: '640px' }}>
              Supervisión de membresías, atención prioritaria de renovaciones y control de acceso.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => onNavigate('clients')} style={{ fontSize: '13px' }}>
              <Icon name="users" size={15} />
              <span>Directorio</span>
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('memberships')} style={{ fontSize: '13px' }}>
              <Icon name="credit-card" size={15} />
              <span>Cobros / Operaciones</span>
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('verification')} style={{ fontSize: '13px' }}>
              <Icon name="shield-check" size={15} color="var(--color-success)" />
              <span>Verificar Acceso</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          NIVEL 1: TARJETAS ANALÍTICAS PRINCIPALES (KPIs con micro-visualizaciones)
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        
        {/* KPI 1: Miembros Registrados + Mini Distribución de Estado */}
        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Miembros Registrados
              </span>
              <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                <Icon name="users" size={18} />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0 4px 0' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-gold)' }}>
                {loading ? <GoldSkeleton width="75px" height="34px" /> : metrics.totalClients}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>en base de datos</span>
            </div>

            {/* Micro visualización de distribución de socios */}
            <div style={{ margin: '10px 0 12px 0', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: '#D4AF37', cursor: 'pointer' }} onClick={() => onNavigate('coverage')} title="Ver vigentes">
                  ● Vig: <b>{metrics.membershipsByStatus?.VIGENTE ?? 0}</b>
                </span>
                <span style={{ color: '#EF4444', cursor: 'pointer' }} onClick={() => onNavigate('coverage')} title="Ver vencidas">
                  ● Venc: <b>{metrics.membershipsByStatus?.VENCIDO ?? 0}</b>
                </span>
                <span style={{ color: '#64748B' }}>
                  ● Sin Plan: <b>{Math.max(0, (metrics.totalClients || 0) - ((metrics.membershipsByStatus?.VIGENTE ?? 0) + (metrics.membershipsByStatus?.VENCIDO ?? 0)))}</b>
                </span>
              </div>
              {/* Barra segmentada */}
              <div style={{ height: '5px', width: '100%', background: '#1E293B', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${metrics.totalClients ? ((metrics.membershipsByStatus?.VIGENTE ?? 0) / metrics.totalClients) * 100 : 0}%`, background: '#D4AF37' }} title="Vigentes" />
                <div style={{ width: `${metrics.totalClients ? ((metrics.membershipsByStatus?.VENCIDO ?? 0) / metrics.totalClients) * 100 : 0}%`, background: '#EF4444' }} title="Vencidas" />
                <div style={{ flex: 1, background: '#475569' }} title="Sin Membresía / Inactivos" />
              </div>
            </div>
          </div>

          <Button variant="secondary" onClick={() => onNavigate('clients')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Directorio</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 2: Planes en Catálogo + Distribución por Plan */}
        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Planes en Catálogo
              </span>
              <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                <Icon name="tag" size={18} />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0 4px 0' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-gold)' }}>
                {loading ? <GoldSkeleton width="55px" height="34px" /> : metrics.activePlans}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>tarifas activas</span>
            </div>

            {/* Micro visualización de distribución por planes */}
            <div style={{ margin: '10px 0 12px 0', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
                <span>Top Plan:</span>
                <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                  {metrics.membershipsByPlan?.[0]?.planName || 'Catálogo Oficial'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                <span>Socios con plan:</span>
                <b style={{ color: '#F1F5F9' }}>{metrics.membershipsByPlan.reduce((acc, p) => acc + p.memberCount, 0)} afiliados</b>
              </div>
            </div>
          </div>

          <Button variant="secondary" onClick={() => onNavigate('plans')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Planes</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 3: Alertas de Vencimiento + Intervalo */}
        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Alertas de Vencimiento
              </span>
              <span style={{ color: 'var(--color-warning)' }} aria-hidden="true">
                <Icon name="calendar" size={18} />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0 4px 0' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-warning)' }}>
                {loading ? <GoldSkeleton width="55px" height="34px" /> : metrics.totalAlerts}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>socios en riesgo</span>
            </div>

            {/* Micro visualización de intervalos */}
            <div style={{ margin: '10px 0 12px 0', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#EF4444' }}>Vencidas: <b>{metrics.expirationsByInterval?.['Vencidas'] ?? 0}</b></span>
                <span style={{ color: '#F59E0B' }}>1-7d: <b>{metrics.expirationsByInterval?.['1 a 7 días'] ?? 0}</b></span>
                <span style={{ color: '#94A3B8' }}>8-30d: <b>{metrics.expirationsByInterval?.['8 a 30 días'] ?? 0}</b></span>
              </div>
            </div>
          </div>

          <Button variant="secondary" onClick={() => onNavigate('coverage')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Vigencias</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 4: Asistencia Hoy + Tendencia */}
        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Asistencia Hoy
              </span>
              <span style={{ color: 'var(--color-success)' }} aria-hidden="true">
                <Icon name="check-circle" size={18} />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0 4px 0' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-success)' }}>
                {loading ? '...' : metrics.todayAttendance}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>check-ins validados</span>
            </div>

            {/* Micro visualización de 7 días */}
            <div style={{ margin: '10px 0 12px 0', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '22px', gap: '3px' }}>
                {attendanceCounts.map((cnt, i) => {
                  const max = Math.max(...attendanceCounts, 1);
                  const h = Math.max(4, Math.round((cnt / max) * 20));
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: `${h}px`, backgroundColor: i === 6 ? '#10B981' : 'rgba(16, 185, 129, 0.4)', borderRadius: '2px' }} title={`${attendanceDays[i]}: ${cnt}`} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748B', marginTop: '3px' }}>
                <span>7d atrás</span>
                <span>Hoy</span>
              </div>
            </div>
          </div>

          <Button variant="secondary" onClick={() => onNavigate('verification')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Terminal</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 5: Finanzas (ADMIN/AUDITOR) o Pedidos Suplementos (RECEPCION) */}
        {canViewFinancials ? (
          <div className="card kpi-card" style={{ padding: '18px 20px', border: '1px solid var(--color-gold-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  Recaudación Mes (PEN)
                </span>
                <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                  <Icon name="credit-card" size={18} />
                </span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-gold)', margin: '6px 0 4px 0' }}>
                {loading ? '...' : `S/ ${(metrics.financialSummary?.monthlyRevenuePen ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
              </div>

              {/* Micro visualización de recaudación */}
              <div style={{ margin: '10px 0 12px 0', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Hoy:</span>
                  <b style={{ color: '#10B981' }}>S/ {(metrics.financialSummary?.todayRevenuePen ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</b>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  Pedidos por Despachar
                </span>
                <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                  <Icon name="package" size={18} />
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '6px 0 4px 0' }}>
                {loading ? '...' : metrics.pendingOrders}
              </div>

              <div style={{ margin: '10px 0 12px 0', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Suplementos en cola de retiro QR
                </span>
              </div>
            </div>

            <Button variant="secondary" onClick={() => onNavigate('supplementOrders')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
              <span>Bandeja Pedidos</span>
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>
        )}
      </div>

      {/* =========================================================================
          NIVEL 2: GRÁFICOS DE MEMBRESÍAS Y PLANES (con ChartActions y Exportación)
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Gráfico Donut: Estado de Membresías */}
        <AnalyticsChartCard
          title="Estado de Membresías"
          subtitle="Distribución autoritativa de cobertura activa"
          iconName="pie-chart"
          badge="Tiempo Real"
          filename="gymvip_estado_membresias"
          tableData={membershipStatusTableData}
          isLoading={loading}
        >
          <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart
              series={[
                {
                  data: displayStatusPie,
                  innerRadius: 46,
                  outerRadius: 82,
                  paddingAngle: 3,
                  cornerRadius: 4,
                },
              ]}
              height={230}
              margin={{ top: 10, bottom: 20, left: 10, right: 120 }}
              slotProps={{
                legend: {
                  labelStyle: { fill: '#CBD5E1', fontSize: 12 },
                },
              }}
            />
          </div>
        </AnalyticsChartCard>

        {/* Gráfico: Miembros por Plan Activo */}
        <AnalyticsChartCard
          title="Popularidad de Planes Activos"
          subtitle="Top de membresías vigentes por plan"
          iconName="tag"
          badge="Top Planes"
          filename="gymvip_planes_activos"
          tableData={plansTableData}
          isLoading={loading}
          isEmpty={metrics.membershipsByPlan.length === 0}
          emptyMessage="Aún no se han asignado planes vigentes en el sistema."
        >
          <div style={{ height: '240px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', padding: '0 8px' }}>
            {metrics.membershipsByPlan.map((plan, idx) => {
              const maxCount = Math.max(...metrics.membershipsByPlan.map(p => p.memberCount), 1);
              const pct = Math.round((plan.memberCount / maxCount) * 100);
              return (
                <div key={idx} style={{ cursor: 'pointer' }} onClick={() => onNavigate('plans')} title="Ver plan">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{plan.planName}</span>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{plan.memberCount} socios</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--color-bg-surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, var(--color-gold-hover) 0%, var(--color-gold) 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AnalyticsChartCard>
      </div>

      {/* =========================================================================
          NIVEL 3: ASISTENCIA Y VENCIMIENTOS (con ChartActions y Exportación)
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Gráfico de Asistencia Últimos 7 Días */}
        <AnalyticsChartCard
          title="Afluencia y Asistencia (7 Días)"
          subtitle="Marcaciones validadas en torniquete (America/Lima)"
          iconName="check-circle"
          filename="gymvip_asistencia_semanal"
          tableData={attendanceTableData}
          isLoading={loading}
        >
          <div style={{ height: '240px', width: '100%' }}>
            <BarChart
              xAxis={[{
                scaleType: 'band',
                data: attendanceDays,
                tickLabelStyle: { fill: '#94A3B8', fontSize: 11 },
              }]}
              yAxis={[{
                tickLabelStyle: { fill: '#94A3B8', fontSize: 11 },
              }]}
              series={[{
                data: attendanceCounts,
                color: '#10B981',
                label: 'Asistencias',
              }]}
              height={230}
              margin={{ top: 20, bottom: 25, left: 35, right: 15 }}
              slotProps={{
                legend: {
                  labelStyle: { fill: '#CBD5E1', fontSize: 11 },
                },
              }}
            />
          </div>
        </AnalyticsChartCard>

        {/* Gráfico de Vencimientos por Intervalo */}
        <AnalyticsChartCard
          title="Vencimientos por Intervalo"
          subtitle="Previsión de renovación y cobranza"
          iconName="calendar"
          filename="gymvip_vencimientos_intervalo"
          tableData={expirationTableData}
          isLoading={loading}
        >
          <div style={{ height: '240px', width: '100%' }}>
            <BarChart
              xAxis={[{
                scaleType: 'band',
                data: expirationLabels,
                tickLabelStyle: { fill: '#94A3B8', fontSize: 10 },
              }]}
              yAxis={[{
                tickLabelStyle: { fill: '#94A3B8', fontSize: 11 },
              }]}
              series={[{
                data: expirationValues,
                color: '#F59E0B',
                label: 'Socios',
              }]}
              height={230}
              margin={{ top: 20, bottom: 25, left: 35, right: 15 }}
              slotProps={{
                legend: {
                  labelStyle: { fill: '#CBD5E1', fontSize: 11 },
                },
              }}
            />
          </div>
        </AnalyticsChartCard>
      </div>

      {/* =========================================================================
          NIVEL 4: FINANZAS Y DESPACHO (exclusivo ADMIN / AUDITOR)
          ========================================================================= */}
      {canViewFinancials && paymentMethodsPie.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <AnalyticsChartCard
            title="Ingresos por Método de Pago (Mes Actual)"
            subtitle="Recaudación consolidada por canal de cobranza"
            iconName="credit-card"
            badge="Exclusivo Finanzas"
            filename="gymvip_ingresos_metodo_pago"
            tableData={financialsTableData}
            isLoading={loading}
          >
            <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: paymentMethodsPie,
                    innerRadius: 40,
                    outerRadius: 75,
                    paddingAngle: 3,
                    cornerRadius: 4,
                  },
                ]}
                height={210}
                margin={{ top: 10, bottom: 20, left: 10, right: 140 }}
                slotProps={{
                  legend: {
                    labelStyle: { fill: '#CBD5E1', fontSize: 12 },
                  },
                }}
              />
            </div>
          </AnalyticsChartCard>
        </div>
      )}

      {/* =========================================================================
          NIVEL 5: ATENCIÓN PRIORITARIA DE VENCIMIENTOS
          ========================================================================= */}
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

      {/* Modal de Ficha Rápida / Renovación */}
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
