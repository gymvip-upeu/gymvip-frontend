// ==============================================================================
// GYM VIP — Componente: AnalyticsChartCard (Contenedor Reutilizable de Gráficos)
// Incorpora Cabecera, Acciones de Exportación, Tabla de Datos y Estados Vacío/Carga
// ==============================================================================

import React, { useRef } from 'react';
import { ChartActions } from './ChartActions';
import { Icon } from './Icons';

export function AnalyticsChartCard({
  title,
  subtitle,
  iconName = 'bar-chart',
  badge = null,
  filename = 'grafico_gymvip',
  tableData = null,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'Sin datos disponibles para el período',
  children,
  style = {},
  actionButton = null,
}) {
  const chartRef = useRef(null);

  return (
    <div
      className="dashboard-card analytics-chart-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface-panel)',
        padding: '18px 20px',
        position: 'relative',
        minHeight: '260px',
        ...style,
      }}
    >
      {/* Cabecera de la Tarjeta con Título y Acciones */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '14px',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name={iconName} size={16} color="var(--color-gold)" />
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
                letterSpacing: '0.02em',
              }}
            >
              {title}
            </h3>
            {badge && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  color: 'var(--color-gold)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '24px' }}>
              {subtitle}
            </span>
          )}
        </div>

        {/* Toolbar de Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actionButton}
          {!isLoading && !error && !isEmpty && (
            <ChartActions
              targetRef={chartRef}
              title={title}
              filename={filename}
              tableData={tableData}
            />
          )}
        </div>
      </div>

      {/* Contenido del Gráfico con referencia para Canvas / Captura */}
      <div
        ref={chartRef}
        className="chart-viewport"
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', border: '2px solid rgba(212, 175, 55, 0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '12px' }}>Cargando visualización...</span>
          </div>
        )}

        {error && !isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#EF4444', fontSize: '13px' }}>
            <span>Error al cargar métricas: {error}</span>
          </div>
        )}

        {isEmpty && !isLoading && !error && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            <span>{emptyMessage}</span>
          </div>
        )}

        {!isLoading && !error && !isEmpty && children}
      </div>
    </div>
  );
}

export default AnalyticsChartCard;
