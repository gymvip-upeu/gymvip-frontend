// ==============================================================================
// GYM VIP — Pantalla: ReportsPage (Constructor de Reportes Dinámicos y Métricas)
// Análisis configurable con selección de indicadores, períodos, gráficos MUI X-Charts,
// plantillas ejecutivas, favoritos en localStorage y exportación multiformato (PNG, CSV, XLSX, PDF)
// ==============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  REPORT_METRICS,
  REPORT_TEMPLATES,
  DATE_PRESETS,
  calculateDatePreset,
  getReportApi,
  exportReportApi,
} from '../api/reportsApi';
import { fetchDashboardMetrics } from '../api/dashboardApi';
import { AnalyticsChartCard } from '../components/common/AnalyticsChartCard';
import { Icon } from '../components/common/Icons';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';

import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

export default function ReportsPage() {
  const { token } = useAuth();

  // Preset de fecha y rangos
  const [selectedPreset, setSelectedPreset] = useState('this_month');
  const [dateRange, setDateRange] = useState(() => calculateDatePreset('this_month'));

  // Métricas seleccionadas
  const [selectedMetrics, setSelectedMetrics] = useState([
    'memberRegistrations',
    'attendance',
    'plansAssigned',
    'membershipPaymentsPen',
  ]);

  // Tipo de visualización seleccionada
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line' | 'donut' | 'kpi' | 'table'

  // Plantilla activa
  const [activeTemplate, setActiveTemplate] = useState('executive_summary');

  // Estado del servidor
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Reportes guardados / favoritos en localStorage
  const [savedReports, setSavedReports] = useState(() => {
    try {
      const saved = localStorage.getItem('gymvip_custom_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customReportName, setCustomReportName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [overviewMetrics, setOverviewMetrics] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const loadOverviewMetrics = useCallback(async () => {
    if (!token) return;
    setOverviewLoading(true);
    try {
      const data = await fetchDashboardMetrics(token);
      setOverviewMetrics(data || null);
    } catch {
      setOverviewMetrics(null);
    } finally {
      setOverviewLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOverviewMetrics();
  }, [loadOverviewMetrics]);

  // Manejo de cambio de preset de fecha
  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    if (presetId !== 'custom') {
      setDateRange(calculateDatePreset(presetId));
    }
  };

  // Carga de snapshot desde backend
  const loadReportData = useCallback(async () => {
    if (!token || selectedMetrics.length === 0) {
      setSnapshot(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await getReportApi(dateRange.from, dateRange.to, selectedMetrics, token);
      setSnapshot(res);
    } catch (err) {
      setError(err.message || 'No se pudo generar el reporte para el período seleccionado.');
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [token, dateRange.from, dateRange.to, selectedMetrics]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Aplicar plantilla rápida
  const applyTemplate = (template) => {
    setActiveTemplate(template.id);
    setSelectedMetrics(template.metrics);
    setChartType(template.chartType || 'bar');
  };

  // Alternar métrica individual
  const toggleMetric = (metricKey) => {
    setActiveTemplate('custom');
    setSelectedMetrics((prev) => {
      if (prev.includes(metricKey)) {
        if (prev.length === 1) return prev; // Mantener al menos una
        return prev.filter((k) => k !== metricKey);
      }
      return [...prev, metricKey];
    });
  };

  // Exportar XLSX o PDF desde el backend
  const handleExportBackend = async (format) => {
    if (!token || selectedMetrics.length === 0) return;
    setExportingFormat(format);
    setError('');
    try {
      const blob = await exportReportApi(dateRange.from, dateRange.to, selectedMetrics, format, token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_gymvip_${dateRange.from}_a_${dateRange.to}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setFeedbackMsg(`Reporte exportado exitosamente en .${format.toUpperCase()}`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setError(err.message || `Error al exportar en formato .${format}`);
    } finally {
      setExportingFormat(null);
    }
  };

  // Guardar configuración actual como favorito
  const handleSaveFavorite = () => {
    if (!customReportName.trim()) return;
    const newReport = {
      id: `rep_${Date.now()}`,
      name: customReportName.trim(),
      metrics: [...selectedMetrics],
      preset: selectedPreset,
      chartType,
      dateRange,
      createdAt: new Date().toISOString(),
    };
    const updated = [newReport, ...savedReports.slice(0, 9)];
    setSavedReports(updated);
    try {
      localStorage.setItem('gymvip_custom_reports', JSON.stringify(updated));
    } catch {}
    setCustomReportName('');
    setShowSaveModal(false);
    setFeedbackMsg('Reporte personalizado guardado en favoritos');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleApplySavedReport = (saved) => {
    setSelectedMetrics(saved.metrics);
    setChartType(saved.chartType);
    setSelectedPreset(saved.preset);
    if (saved.preset === 'custom' && saved.dateRange) {
      setDateRange(saved.dateRange);
    } else {
      setDateRange(calculateDatePreset(saved.preset));
    }
    setActiveTemplate('custom');
  };

  const handleDeleteSavedReport = (id) => {
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    try {
      localStorage.setItem('gymvip_custom_reports', JSON.stringify(updated));
    } catch {}
  };

  // Preparación de datos para gráficos
  const metricLabelsMap = useMemo(() => new Map(REPORT_METRICS), []);

  const barChartData = useMemo(() => {
    if (!snapshot?.metrics) return { xAxis: [], series: [] };
    const labels = selectedMetrics.map((k) => metricLabelsMap.get(k) || k);
    const values = selectedMetrics.map((k) => Number(snapshot.metrics[k] || 0));
    return {
      xAxis: [{ scaleType: 'band', data: labels }],
      series: [{ data: values, color: '#D4AF37', label: 'Valor Acumulado' }],
    };
  }, [snapshot, selectedMetrics, metricLabelsMap]);

  const donutChartData = useMemo(() => {
    if (!snapshot?.metrics) return [];
    const colors = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];
    return selectedMetrics.map((k, index) => ({
      id: index,
      value: Number(snapshot.metrics[k] || 0),
      label: metricLabelsMap.get(k) || k,
      color: colors[index % colors.length],
    }));
  }, [snapshot, selectedMetrics, metricLabelsMap]);

  // Datos para exportación de tabla y CSV
  const tableExportData = useMemo(() => {
    if (!snapshot?.metrics) return null;
    const headers = ['Métrica', 'Identificador Técnico', 'Valor Registrado', 'Unidad'];
    const rows = selectedMetrics.map((k) => [
      metricLabelsMap.get(k) || k,
      k,
      snapshot.metrics[k] ?? 0,
      k.includes('Pen') ? 'PEN (Soles)' : 'Unidades',
    ]);
    return { headers, rows };
  }, [snapshot, selectedMetrics, metricLabelsMap]);

  return (
    <div className="reports-page-luxury" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Encabezado Principal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-gold)' }}>
              ANÁLISIS & BUSINESS INTELLIGENCE
            </span>
            <Badge variant="gold" style={{ fontSize: '10px' }}>
              OFICIAL
            </Badge>
          </div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              margin: '0 0 6px 0',
              color: 'var(--color-text-primary)',
            }}
          >
            Reportes Personalizables y Métricas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            Constructor visual de análisis con agregación en tiempo real, filtros dinámicos y exportación certificada.
          </p>
        </div>

        {/* Acciones de Exportación Global */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSaveModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="tag" size={14} color="var(--color-gold)" />
            <span>Guardar Favorito</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleExportBackend('xlsx')}
            disabled={loading || exportingFormat === 'xlsx' || selectedMetrics.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="download" size={14} color="#10B981" />
            <span>{exportingFormat === 'xlsx' ? 'Generando XLSX...' : 'Exportar Excel'}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleExportBackend('pdf')}
            disabled={loading || exportingFormat === 'pdf' || selectedMetrics.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="download" size={14} color="#EF4444" />
            <span>{exportingFormat === 'pdf' ? 'Generando PDF...' : 'Exportar PDF'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={loadReportData}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="activity" size={14} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <Alert variant="success" message={feedbackMsg} autoClose onClose={() => setFeedbackMsg(null)} />
      )}
      {error && <Alert variant="danger" title="Error en Consulta de Reportes" message={error} onClose={() => setError('')} />}

      {/* Barra de Plantillas Rápidas */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            alignSelf: 'center',
            marginRight: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          Plantillas:
        </span>
        {REPORT_TEMPLATES.map((tmpl) => {
          const isActive = activeTemplate === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => applyTemplate(tmpl)}
              style={{
                borderRadius: 'var(--radius-full)',
                whiteSpace: 'nowrap',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
              }}
              title={tmpl.description}
            >
              {tmpl.name}
            </button>
          );
        })}
      </div>

      {/* Grid Superior: Constructor de Filtros y Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        {/* Panel 1: Período y Rango de Fechas */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Icon name="calendar" size={16} color="var(--color-gold)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              1. Período y Rango Temporal
            </h3>
          </div>

          {/* Selector de Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn btn-sm ${selectedPreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePresetChange(p.id)}
                style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Fechas From - To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Fecha Inicial (Desde):
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateRange.from}
                onChange={(e) => {
                  setSelectedPreset('custom');
                  setDateRange((prev) => ({ ...prev, from: e.target.value }));
                }}
                style={{ width: '100%', fontSize: '12px' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Fecha Final (Hasta):
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateRange.to}
                onChange={(e) => {
                  setSelectedPreset('custom');
                  setDateRange((prev) => ({ ...prev, to: e.target.value }));
                }}
                style={{ width: '100%', fontSize: '12px' }}
              />
            </div>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '8px' }}>
            Zona horaria de cómputo: America/Lima (UTC-5)
          </span>
        </div>

        {/* Panel 2: Formato de Visualización */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Icon name="bar-chart" size={16} color="var(--color-gold)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              2. Formato de Visualización
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {[
              { id: 'bar', label: 'Barras', icon: 'bar-chart' },
              { id: 'donut', label: 'Donut / Circular', icon: 'activity' },
              { id: 'kpi', label: 'Tarjetas KPI', icon: 'check-circle' },
              { id: 'table', label: 'Tabla Detallada', icon: 'package' },
            ].map((v) => {
              const isSelected = chartType === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setChartType(v.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 8px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'var(--color-surface)',
                    color: isSelected ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Icon name={v.icon} size={18} color={isSelected ? 'var(--color-gold)' : 'currentColor'} />
                  <span style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500 }}>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Favoritos guardados */}
          {savedReports.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Mis Reportes Guardados ({savedReports.length}):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {savedReports.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleApplySavedReport(s)}
                  >
                    <span>{s.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSavedReport(s.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title="Eliminar favorito"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selector de Indicadores / Métricas Multi-select */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="tag" size={16} color="var(--color-gold)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              3. Catálogo de Métricas Seleccionadas ({selectedMetrics.length}/{REPORT_METRICS.length})
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedMetrics(REPORT_METRICS.map(([k]) => k))}
              style={{ fontSize: '10px', height: '26px' }}
            >
              Seleccionar Todas
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedMetrics(['memberRegistrations', 'attendance'])}
              style={{ fontSize: '10px', height: '26px' }}
            >
              Mínimo Operativo
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '8px',
          }}
        >
          {REPORT_METRICS.map(([key, label]) => {
            const isChecked = selectedMetrics.includes(key);
            return (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: isChecked ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid var(--color-border)',
                  backgroundColor: isChecked ? 'rgba(212, 175, 55, 0.08)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: isChecked ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                  fontWeight: isChecked ? 600 : 400,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleMetric(key)}
                  style={{ accentColor: 'var(--color-gold)' }}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Área Principal de Resultados y Visualización */}
      <AnalyticsChartCard
        title={`Análisis Operativo: ${dateRange.from} al ${dateRange.to}`}
        subtitle={`Vista en modo ${chartType.toUpperCase()} · ${selectedMetrics.length} métricas calculadas`}
        iconName="bar-chart"
        badge={chartType.toUpperCase()}
        filename={`reporte_gymvip_${dateRange.from}_${dateRange.to}`}
        tableData={tableExportData}
        isLoading={loading}
        isEmpty={!snapshot || selectedMetrics.length === 0}
        emptyMessage="Selecciona al menos una métrica para visualizar el análisis."
      >
        {/* Visualización 1: Gráfico de Barras */}
        {chartType === 'bar' && snapshot && (
          <div style={{ width: '100%', height: '360px', marginTop: '10px' }}>
            <BarChart
              xAxis={barChartData.xAxis}
              series={barChartData.series}
              height={350}
              colors={['#D4AF37']}
              slotProps={{
                legend: { hidden: true },
              }}
            />
          </div>
        )}

        {/* Visualización 2: Gráfico Donut */}
        {chartType === 'donut' && snapshot && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '340px',
              padding: '10px',
            }}
          >
            <PieChart
              series={[
                {
                  data: donutChartData,
                  innerRadius: 60,
                  outerRadius: 120,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  arcLabel: (item) => `${item.value}`,
                  arcLabelMinAngle: 20,
                },
              ]}
              height={300}
              width={420}
            />
          </div>
        )}

        {/* Visualización 3: Tarjetas KPI */}
        {chartType === 'kpi' && snapshot && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              padding: '12px 0',
            }}
          >
            {selectedMetrics.map((key) => {
              const label = metricLabelsMap.get(key) || key;
              const val = snapshot.metrics[key] ?? 0;
              const isMoney = key.includes('Pen');
              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: '26px',
                      fontWeight: 800,
                      color: 'var(--color-gold)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {isMoney ? `S/ ${Number(val).toFixed(2)}` : val}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    Total acumulado en el período
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Visualización 4: Tabla Detallada */}
        {chartType === 'table' && snapshot && (
          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table className="table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Métrica Operativa</th>
                  <th style={{ textAlign: 'left' }}>Código / Parámetro</th>
                  <th style={{ textAlign: 'right' }}>Valor Acumulado</th>
                  <th style={{ textAlign: 'center' }}>Unidad</th>
                </tr>
              </thead>
              <tbody>
                {selectedMetrics.map((key) => {
                  const label = metricLabelsMap.get(key) || key;
                  const val = snapshot.metrics[key] ?? 0;
                  const isMoney = key.includes('Pen');
                  return (
                    <tr key={key}>
                      <td style={{ fontWeight: 600 }}>{label}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{key}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-gold)' }}>
                        {isMoney ? `S/ ${Number(val).toFixed(2)}` : val}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant="neutral">{isMoney ? 'PEN' : 'CANTIDAD'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AnalyticsChartCard>

      {/* Analítica Gerencial Consolidada (trasladada del Dashboard principal) */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--color-text-primary)' }}>
            Analítica Gerencial del Club
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Distribución de membresías, popularidad de planes, afluencia semanal, vencimientos y recaudación por método de pago.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <AnalyticsChartCard
            title="Estado de Membresías"
            subtitle="Distribución autoritativa de cobertura activa"
            iconName="pie-chart"
            badge="Tiempo Real"
            filename="gymvip_estado_membresias"
            isLoading={overviewLoading}
          >
            <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: (() => {
                      const s = overviewMetrics?.membershipsByStatus || {};
                      const items = [
                        { id: 0, value: s.VIGENTE ?? 0, label: 'Vigentes', color: '#D4AF37' },
                        { id: 1, value: s.VENCIDO ?? 0, label: 'Vencidas', color: '#EF4444' },
                        { id: 2, value: s.CONGELADO ?? 0, label: 'Congeladas', color: '#3B82F6' },
                        { id: 3, value: s.CANCELADO ?? 0, label: 'Canceladas', color: '#64748B' },
                      ].filter((d) => d.value > 0);
                      return items.length ? items : [{ id: 99, value: 1, label: 'Sin Datos', color: '#334155' }];
                    })(),
                    innerRadius: 46,
                    outerRadius: 82,
                    paddingAngle: 3,
                    cornerRadius: 4,
                  },
                ]}
                height={230}
                margin={{ top: 10, bottom: 20, left: 10, right: 120 }}
              />
            </div>
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Popularidad de Planes Activos"
            subtitle="Top de membresías vigentes por plan"
            iconName="tag"
            badge="Top Planes"
            filename="gymvip_planes_activos"
            isLoading={overviewLoading}
            isEmpty={!overviewMetrics?.membershipsByPlan?.length}
            emptyMessage="Aún no se han asignado planes vigentes en el sistema."
          >
            <div style={{ height: '240px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', padding: '0 8px' }}>
              {(overviewMetrics?.membershipsByPlan || []).map((plan, idx) => {
                const maxCount = Math.max(...(overviewMetrics?.membershipsByPlan || []).map((p) => p.memberCount), 1);
                const pct = Math.round((plan.memberCount / maxCount) * 100);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{plan.planName}</span>
                      <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{plan.memberCount} socios</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--color-bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-gold)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </AnalyticsChartCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <AnalyticsChartCard
            title="Afluencia y Asistencia (7 Días)"
            subtitle="Marcaciones validadas en torniquete (America/Lima)"
            iconName="check-circle"
            filename="gymvip_asistencia_semanal"
            isLoading={overviewLoading}
          >
            <div style={{ height: '240px', width: '100%' }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: (overviewMetrics?.recentAttendance7Days || []).map((d) => d.dayName) }]}
                series={[{ data: (overviewMetrics?.recentAttendance7Days || []).map((d) => d.count), color: '#10B981', label: 'Asistencias' }]}
                height={230}
                margin={{ top: 20, bottom: 25, left: 35, right: 15 }}
              />
            </div>
          </AnalyticsChartCard>

          <AnalyticsChartCard
            title="Vencimientos por Intervalo"
            subtitle="Previsión de renovación y cobranza"
            iconName="calendar"
            filename="gymvip_vencimientos_intervalo"
            isLoading={overviewLoading}
          >
            <div style={{ height: '240px', width: '100%' }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: Object.keys(overviewMetrics?.expirationsByInterval || {}) }]}
                series={[{ data: Object.values(overviewMetrics?.expirationsByInterval || {}), color: '#F59E0B', label: 'Socios' }]}
                height={230}
                margin={{ top: 20, bottom: 25, left: 35, right: 15 }}
              />
            </div>
          </AnalyticsChartCard>
        </div>

        {overviewMetrics?.financialSummary?.revenueByMethod && Object.values(overviewMetrics.financialSummary.revenueByMethod).some((v) => Number(v) > 0) && (
          <AnalyticsChartCard
            title="Ingresos por Método de Pago (Mes Actual)"
            subtitle="Recaudación consolidada por canal de cobranza"
            iconName="credit-card"
            badge="Finanzas"
            filename="gymvip_ingresos_metodo_pago"
            isLoading={overviewLoading}
          >
            <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: Object.entries(overviewMetrics.financialSummary.revenueByMethod)
                      .map(([method, amount], idx) => ({
                        id: idx,
                        value: Number(amount),
                        label: method,
                        color: ['#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][idx % 5],
                      }))
                      .filter((d) => d.value > 0),
                    innerRadius: 40,
                    outerRadius: 75,
                    paddingAngle: 3,
                    cornerRadius: 4,
                  },
                ]}
                height={210}
                margin={{ top: 10, bottom: 20, left: 10, right: 140 }}
              />
            </div>
          </AnalyticsChartCard>
        )}
      </div>

      {/* Modal para Guardar Favorito */}
      {showSaveModal && (
        <div className="drawer-backdrop" onClick={() => setShowSaveModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'var(--color-surface-panel)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '440px',
              width: '90%',
              zIndex: 1100,
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0' }}>Guardar Reporte Favorito</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Ingresa un nombre para guardar esta configuración de métricas y formato en tus accesos rápidos.
            </p>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Resumen Quincenal de Altas"
              value={customReportName}
              onChange={(e) => setCustomReportName(e.target.value)}
              style={{ width: '100%', marginBottom: '18px' }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSaveModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveFavorite}
                disabled={!customReportName.trim()}
              >
                Guardar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
