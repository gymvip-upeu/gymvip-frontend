// ==============================================================================
// GYM VIP — Pantalla: HomePage (Panel de Control Principal Luxury - Fase 13)
// Dashboard ejecutivo, visual y analítico con métricas en tiempo real y soporte RBAC
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
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
      // 1. Carga agregada de métricas analíticas del backend (Fase 13)
      const [dashboardMetrics, clientsData, plansData] = await Promise.all([
        fetchDashboardMetrics(token).catch(() => null),
        fetchClients('', 0, 1, token).catch(() => ({ totalElements: 0 })),
        fetchPlans('ACTIVO', token).catch(() => []),
      ]);

      let alertsCount = dashboardMetrics?.totalAlerts ?? 0;
      let alertsList = [];

      // 2. Consulta de lista detallada de alertas para atención prioritaria (Nivel 5)
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
  const statusPieData = [
    { id: 0, value: metrics.membershipsByStatus?.VIGENTE ?? 0, label: 'Vigentes', color: '#D4AF37' },
    { id: 1, value: metrics.membershipsByStatus?.VENCIDO ?? 0, label: 'Vencidas', color: '#EF4444' },
    { id: 2, value: metrics.membershipsByStatus?.CONGELADO ?? 0, label: 'Congeladas', color: '#3B82F6' },
    { id: 3, value: metrics.membershipsByStatus?.CANCELADO ?? 0, label: 'Canceladas', color: '#64748B' },
  ].filter(item => item.value > 0);

  // Fallback si no hay membresías registradas
  const displayStatusPie = statusPieData.length > 0 ? statusPieData : [
    { id: 0, value: 1, label: 'Sin Datos', color: '#334155' }
  ];

  // Preparación de datos para Gráfico de Asistencia (Últimos 7 días)
  const attendanceDays = metrics.recentAttendance7Days.length > 0
    ? metrics.recentAttendance7Days.map(d => d.dayName)
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const attendanceCounts = metrics.recentAttendance7Days.length > 0
    ? metrics.recentAttendance7Days.map(d => d.count)
    : [0, 0, 0, 0, 0, 0, 0];

  // Preparación de datos para Vencimientos por Intervalo
  const expirationKeys = Object.keys(metrics.expirationsByInterval);
  const expirationLabels = expirationKeys.length > 0 ? expirationKeys : ['Vencidas', 'Hoy', '1-7d', '8-30d', '>30d'];
  const expirationValues = expirationKeys.length > 0 ? Object.values(metrics.expirationsByInterval) : [0, 0, 0, 0, 0];

  // Métodos de pago (si ADMIN/AUDITOR)
  const paymentMethodsPie = metrics.financialSummary?.revenueByMethod
    ? Object.entries(metrics.financialSummary.revenueByMethod).map(([method, amount], idx) => ({
        id: idx,
        value: Number(amount),
        label: method,
        color: idx === 0 ? '#D4AF37' : idx === 1 ? '#10B981' : idx === 2 ? '#3B82F6' : '#F59E0B'
      })).filter(m => m.value > 0)
    : [];

  return (
    <div className="home-dashboard" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* =========================================================================
          NIVEL 1: Banner Ejecutivo y Acceso Rápido
          ========================================================================= */}
      <div
        className="card home-hero-banner"
        style={{
          padding: '24px 28px',
          marginBottom: '24px',
          backgroundImage: `linear-gradient(135deg, rgba(11, 13, 18, 0.94) 0%, rgba(21, 25, 34, 0.96) 60%, rgba(212, 175, 55, 0.14) 100%), url(${athleteImg})`,
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
              Supervisión en tiempo real de membresías, asistencia, catálogo de suplementos y control de acceso.
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

      {/* =========================================================================
          NIVEL 1 (Cont.): Tarjetas de Resumen Operativo (KPI Cards)
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
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
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-gold)', margin: '8px 0 4px 0' }}>
            {loading ? '...' : metrics.totalClients}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
            Directorio con código determinista
          </p>
          <Button variant="secondary" onClick={() => onNavigate('clients')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Directorio</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 2: Planes en Catálogo */}
        <div className="card kpi-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Planes en Catálogo
            </span>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="tag" size={20} />
            </span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-gold)', margin: '8px 0 4px 0' }}>
            {loading ? '...' : metrics.activePlans}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
            Tarifario oficial vigente en Soles
          </p>
          <Button variant="secondary" onClick={() => onNavigate('plans')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
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
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-warning)', margin: '8px 0 4px 0' }}>
            {loading ? '...' : metrics.totalAlerts}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
            Socios por vencer o vencidos
          </p>
          <Button variant="secondary" onClick={() => onNavigate('coverage')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Vigencias</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 4: Asistencia Hoy */}
        <div className="card kpi-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Asistencia Hoy
            </span>
            <span style={{ color: 'var(--color-success)' }} aria-hidden="true">
              <Icon name="check-circle" size={20} />
            </span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-success)', margin: '8px 0 4px 0' }}>
            {loading ? '...' : metrics.todayAttendance}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
            Check-ins validados en torniquete
          </p>
          <Button variant="secondary" onClick={() => onNavigate('verification')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ver Terminal</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {/* KPI 5: Finanzas (ADMIN/AUDITOR) o Pedidos Suplementos (RECEPCION) */}
        {canViewFinancials ? (
          <div className="card kpi-card" style={{ padding: '20px', border: '1px solid var(--color-gold-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Recaudación Mes (PEN)
              </span>
              <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                <Icon name="dollar-sign" size={20} />
              </span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-gold)', margin: '8px 0 4px 0' }}>
              {loading ? '...' : `S/ ${(metrics.financialSummary?.monthlyRevenuePen ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
              Hoy: S/ {(metrics.financialSummary?.todayRevenuePen ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
            <Button variant="secondary" onClick={() => onNavigate('reports')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
              <span>Ver Reportes</span>
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>
        ) : (
          <div className="card kpi-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pedidos por Despachar
              </span>
              <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
                <Icon name="package" size={20} />
              </span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '8px 0 4px 0' }}>
              {loading ? '...' : metrics.pendingOrders}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
              Suplementos pendientes de retiro QR
            </p>
            <Button variant="secondary" onClick={() => onNavigate('supplementOrders')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
              <span>Bandeja Pedidos</span>
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>
        )}
      </div>

      {/* =========================================================================
          NIVEL 2: Gráficos de Membresías y Distribución por Plan
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Gráfico Donut: Estado de Membresías */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="pie-chart" size={18} color="var(--color-gold)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Estado de Membresías
              </h3>
            </div>
            <Badge variant="neutral">Tiempo Real</Badge>
          </div>

          <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <LoadingState message="Cargando distribución..." />
            ) : (
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
            )}
          </div>
        </div>

        {/* Gráfico: Miembros por Plan Activo */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="tag" size={18} color="var(--color-gold)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Popularidad de Planes Activos
              </h3>
            </div>
            <Badge variant="gold">Top Planes</Badge>
          </div>

          <div style={{ height: '240px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {loading ? (
              <LoadingState message="Cargando planes..." />
            ) : metrics.membershipsByPlan.length === 0 ? (
              <EmptyState title="Sin Membresías Activas" description="Aún no se han asignado planes vigentes en el sistema." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 8px' }}>
                {metrics.membershipsByPlan.map((plan, idx) => {
                  const maxCount = Math.max(...metrics.membershipsByPlan.map(p => p.memberCount), 1);
                  const pct = Math.round((plan.memberCount / maxCount) * 100);
                  return (
                    <div key={idx}>
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
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          NIVEL 3: Asistencia y Vencimientos Temporales
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Gráfico de Asistencia Últimos 7 Días */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="check-circle" size={18} color="var(--color-success)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Afluencia y Asistencia (7 Días)
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Zona Horaria Lima (UTC-5)</span>
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            {loading ? (
              <LoadingState message="Cargando asistencias..." />
            ) : (
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
            )}
          </div>
        </div>

        {/* Gráfico de Vencimientos por Intervalo */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="calendar" size={18} color="var(--color-warning)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Vencimientos por Intervalo
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Previsión de Renovación</span>
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            {loading ? (
              <LoadingState message="Cargando intervalos..." />
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          NIVEL 4: Finanzas y Despacho según Rol
          ========================================================================= */}
      {canViewFinancials && paymentMethodsPie.length > 0 && (
        <div className="card" style={{ padding: '22px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="dollar-sign" size={18} color="var(--color-gold)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Ingresos por Método de Pago (Mes Actual)
              </h3>
            </div>
            <Badge variant="gold">Exclusivo Finanzas / Auditoría</Badge>
          </div>

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
        </div>
      )}

      {/* =========================================================================
          NIVEL 5: Miembros Próximos a Vencer (Atención Prioritaria)
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
