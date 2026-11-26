// ==============================================================================
// GYM VIP — Pantalla: HomePage (Inicio / Resumen Ejecutivo Luxury Dark & Gold)
// COR-01: Saludo nominal real, selector temporal, KPIs balanceados (4 cols),
// gráficos reales con MUI X-Charts y detección explícita de fallos de API.
// ==============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../contexts/AuthContext';
import { listCoverage } from '../api/jorgeApi';
import { fetchDashboardMetrics } from '../api/dashboardApi';
import { listAdminOrdersApi } from '../api/supplementOrderApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icons';
import { Alert } from '../components/common/Alert';
import { AnalyticsChartCard } from '../components/common/AnalyticsChartCard';
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
  const canViewFinancials = isExecutive || user?.roles?.includes('AUDITOR') || user?.roles?.includes('AUDITOR_EMPRESA');

  const displayName = useMemo(() => {
    const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    if (full) return full;
    const prefix = (user?.email || '').split('@')[0];
    return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Equipo VIP';
  }, [user]);

  const [period, setPeriod] = useState('week'); // 'today' | 'week' | 'month'
  const [metrics, setMetrics] = useState(null);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [pendingOrdersList, setPendingOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');
  const [coverageError, setCoverageError] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setCoverageLoading(true);
    setMetricsError('');
    setCoverageError('');

    try {
      const [dashboardResult, ordersResult] = await Promise.allSettled([
        fetchDashboardMetrics(token),
        isExecutive || isRecepcion()
          ? listAdminOrdersApi({ status: 'PAGADO_POR_VERIFICAR', page: 0, size: 4 }, token)
          : Promise.resolve({ content: [] }),
      ]);

      if (dashboardResult.status === 'fulfilled' && dashboardResult.value) {
        setMetrics(dashboardResult.value);
      } else {
        setMetrics(null);
        setMetricsError(
          dashboardResult.reason?.message || 'No se pudieron obtener las métricas operativas del servidor.'
        );
      }

      if (ordersResult.status === 'fulfilled') {
        const res = ordersResult.value;
        const oList = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
        setPendingOrdersList(oList);
      }

      if (isExecutive || isRecepcion()) {
        try {
          const coverageData = await listCoverage({ state: 'ALERTAS', page: 0, size: 8 }, token);
          const items = Array.isArray(coverageData?.content) ? [...coverageData.content] : [];
          items.sort((a, b) => {
            const dateA = a.lastIncludedDate ? new Date(`${a.lastIncludedDate}T00:00:00Z`).getTime() : Infinity;
            const dateB = b.lastIncludedDate ? new Date(`${b.lastIncludedDate}T00:00:00Z`).getTime() : Infinity;
            return dateA - dateB;
          });
          setExpiringMembers(items.slice(0, 6));
        } catch (e) {
          setCoverageError(e.message || 'No se pudieron consultar las alertas de vencimiento.');
        }
      }
    } finally {
      setLoading(false);
      setCoverageLoading(false);
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

  const recent7 = metrics?.recentAttendance7Days || [];
  const attendanceLabels = useMemo(
    () => (recent7.length > 0 ? recent7.map((d) => d.dayName) : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']),
    [recent7]
  );
  const attendanceSeries = useMemo(
    () =>
      recent7.length > 0
        ? recent7.map((d) => Number(d.count || 0))
        : [0, 0, 0, 0, 0, 0, 0],
    [recent7]
  );

  const periodAttendanceTotal = useMemo(() => {
    if (!metrics) return 0;
    if (period === 'today') return Number(metrics.todayAttendance || 0);
    return attendanceSeries.reduce((acc, n) => acc + n, 0);
  }, [metrics, period, attendanceSeries]);

  const activeClientsRatio = metrics?.totalClients
    ? (metrics.membershipsByStatus?.VIGENTE ?? 0) / metrics.totalClients
    : 0;
  const riskRatio = metrics?.totalClients ? (metrics.totalAlerts || 0) / metrics.totalClients : 0;

  const membershipPieData = useMemo(() => {
    const map = metrics?.membershipsByStatus || {};
    return [
      { id: 0, value: Number(map.VIGENTE || 0), label: 'Vigentes', color: '#D4AF37' },
      { id: 1, value: Number(map.VENCIDO || 0), label: 'Vencidas', color: '#EF4444' },
      { id: 2, value: Number(map.CONGELADO || 0), label: 'Congeladas', color: '#3B82F6' },
      { id: 3, value: Number(map.CANCELADO || 0), label: 'Canceladas', color: '#64748B' },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  return (
    <div className="home-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Hero nominal ejecutivo sin botones redundantes del menú */}
      <div
        className="hero-banner"
        style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '22px',
          border: '1px solid var(--color-border)',
          background: 'linear-gradient(135deg, rgba(11, 19, 32, 0.96) 0%, rgba(17, 24, 39, 0.92) 100%)',
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
            padding: '22px 26px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <Badge variant="gold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                VIP CENTER FIT · SEDE PRINCIPAL
              </Badge>
              <Badge variant="neutral" style={{ fontSize: '11px' }}>
                {user?.roles?.[0] || 'OPERACIÓN'}
              </Badge>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: '#f8fafc' }}>
              Hola, {displayName}
            </h1>
            <p style={{ color: '#cbd5e1', margin: 0, fontSize: '13px', maxWidth: '640px' }}>
              Resumen operativo en tiempo real de socios, asistencias, vencimientos y movimiento económico del club.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div role="group" aria-label="Período de métricas" style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '3px' }}>
              {[
                ['today', 'Hoy'],
                ['week', '7 días'],
                ['month', 'Este mes'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPeriod(id)}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: period === id ? 'var(--color-gold)' : 'transparent',
                    color: period === id ? '#0B1320' : '#cbd5e1',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={loadDashboardData} disabled={loading} style={{ minHeight: '36px', fontSize: '12px' }}>
              <Icon name="refresh" size={14} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {metricsError && (
        <Alert
          variant="danger"
          title="Error al cargar indicadores principales"
          message={`${metricsError} Verifique la conexión con el backend antes de tomar decisiones sobre estas cifras.`}
          onClose={() => setMetricsError('')}
        />
      )}

      {/* NIVEL 1: Grid simétrico de 4 KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '22px' }}>
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
                {loading ? <GoldSkeleton width="70px" height="32px" /> : (metrics ? metrics.totalClients : '—')}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>en cartera</span>
            </div>
            <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--color-gold)' }}>● Vigentes: <b>{metrics?.membershipsByStatus?.VIGENTE ?? '—'}</b></span>
                <span style={{ color: 'var(--color-danger)' }}>● Vencidas: <b>{metrics?.membershipsByStatus?.VENCIDO ?? '—'}</b></span>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('clients')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ir a Directorio</span>
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
                {loading ? <GoldSkeleton width="55px" height="32px" /> : (metrics ? metrics.totalAlerts : '—')}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>requieren gestión</span>
            </div>
            <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--color-danger)' }}>Venc: <b>{metrics?.expirationsByInterval?.Vencidas ?? '—'}</b></span>
                <span style={{ color: 'var(--color-warning)' }}>1-7d: <b>{metrics?.expirationsByInterval?.['1 a 7 días'] ?? '—'}</b></span>
                <span style={{ color: 'var(--color-text-muted)' }}>8-30d: <b>{metrics?.expirationsByInterval?.['8 a 30 días'] ?? '—'}</b></span>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('coverage')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Ir a Vigencias</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        <div className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                {period === 'today' ? 'Asistencia Hoy' : 'Asistencia Últimos 7d'}
              </span>
              <Icon name="check-circle" size={18} color="var(--color-success)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 6px 0' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-success)' }}>
                {loading ? <GoldSkeleton width="55px" height="32px" /> : (metrics ? periodAttendanceTotal : '—')}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>check-ins validados</span>
            </div>
            <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                <span>Hoy: <b style={{ color: 'var(--color-success)' }}>{metrics?.todayAttendance ?? '—'}</b></span>
                <span>Planes activos: <b>{metrics?.activePlans ?? '—'}</b></span>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('attendance')} style={{ width: '100%', fontSize: '12px', minHeight: '32px' }}>
            <span>Agenda Asistencias</span>
            <Icon name="chevron-right" size={13} />
          </Button>
        </div>

        {canViewFinancials ? (
          <div className="card kpi-card" style={{ padding: '18px 20px', border: '1px solid var(--color-gold-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  {period === 'today' ? 'Recaudación Hoy (PEN)' : 'Recaudación Mes (PEN)'}
                </span>
                <Icon name="credit-card" size={18} color="var(--color-gold)" />
              </div>
              <div style={{ fontSize: '27px', fontWeight: 800, color: 'var(--color-gold)', margin: '4px 0 6px 0' }}>
                {loading
                  ? <GoldSkeleton width="95px" height="32px" />
                  : metrics
                  ? `S/ ${(period === 'today' ? (metrics.financialSummary?.todayRevenuePen ?? 0) : (metrics.financialSummary?.monthlyRevenuePen ?? 0)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                  : '—'}
              </div>
              <div style={{ margin: '8px 0 12px 0', background: 'var(--color-bg-elevated)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Cobrado hoy:</span>
                  <b style={{ color: 'var(--color-success)' }}>
                    {metrics ? `S/ ${(metrics.financialSummary?.todayRevenuePen ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '—'}
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
                <Icon name="package" size={18} color="var(--color-gold)" />
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '6px 0 4px 0' }}>
                {loading ? '...' : (metrics?.pendingOrders ?? '—')}
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

      {/* NIVEL 2: VISUALIZACIÓN ANALÍTICA CON MUI X-CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '22px' }}>
        <AnalyticsChartCard
          title="Tendencia de Asistencia (Últimos 7 días)"
          subtitle="Ingresos diarios validados en torniquete"
          filename="inicio_asistencia_7d"
          isLoading={loading}
          error={metricsError}
          tableData={{
            headers: ['Día', 'Asistencias'],
            rows: attendanceLabels.map((lbl, idx) => [lbl, attendanceSeries[idx] ?? 0]),
          }}
        >
          <BarChart
            height={220}
            xAxis={[{ scaleType: 'band', data: attendanceLabels }]}
            series={[{ data: attendanceSeries, label: 'Check-ins', color: '#D4AF37' }]}
            margin={{ top: 16, right: 16, bottom: 28, left: 36 }}
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Distribución de Membresías por Estado"
          subtitle={`Total cartera vigente vs vencida (${metrics?.totalClients ?? 0} socios)`}
          filename="inicio_membresias_estado"
          isLoading={loading}
          error={metricsError}
          isEmpty={!loading && !metricsError && membershipPieData.length === 0}
          emptyMessage="Aún no existen membresías registradas para distribuir."
          tableData={{
            headers: ['Estado', 'Cantidad'],
            rows: membershipPieData.map((d) => [d.label, d.value]),
          }}
        >
          <PieChart
            height={220}
            series={[{ data: membershipPieData, innerRadius: 42, outerRadius: 78, paddingAngle: 3 }]}
          />
        </AnalyticsChartCard>
      </div>

      {/* NIVEL 3: PULSO OPERATIVO DIARIO */}
      {(isExecutive || isRecepcion()) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
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

            {coverageError && <Alert variant="danger" message={coverageError} onClose={() => setCoverageError('')} />}

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
                        <td><strong style={{ color: 'var(--color-text-primary)', fontSize: '13px' }}>{member.fullName}</strong></td>
                        <td style={{ fontSize: '12px', color: 'var(--color-gold)' }}>{member.planName || '—'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{dateLabel(member.lastIncludedDate)}</td>
                        <td>{getUrgencyBadge(member.daysRemaining, member.state)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Button variant="primary" style={{ fontSize: '11px', minHeight: '28px', padding: '0 10px' }} onClick={() => setSelectedClientId(member.clientId)}>
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
