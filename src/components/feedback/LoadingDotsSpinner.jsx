// ==============================================================================
// GYM VIP — Componente Reutilizable: Indicador de Carga con Círculo de Puntos Giratorios
// Estilo Luxury Dark & Gold con soporte de accesibilidad y reducción de movimiento
// ==============================================================================

import React from 'react';

/**
 * Círculo de 8 puntos dispuestos radialmente con opacidad secuencial.
 * Gira en bucle continuo y respeta estrictamente prefers-reduced-motion.
 */
export function LoadingDotsSpinner({
  size = 40,
  color = 'var(--color-gold, #D4AF37)',
  label = 'Cargando información...',
  className = '',
}) {
  // 8 puntos distribuidos uniformemente cada 45 grados (Radio = 16, Centro = 24, 24)
  const dots = [
    { cx: 24, cy: 8, opacity: 0.2 },
    { cx: 35.31, cy: 12.69, opacity: 0.3 },
    { cx: 40, cy: 24, opacity: 0.42 },
    { cx: 35.31, cy: 35.31, opacity: 0.55 },
    { cx: 24, cy: 40, opacity: 0.68 },
    { cx: 12.69, cy: 35.31, opacity: 0.8 },
    { cx: 8, cy: 24, opacity: 0.92 },
    { cx: 12.69, cy: 12.69, opacity: 1.0 },
  ];

  return (
    <div
      className={`gymvip-dots-spinner-container ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        className="gymvip-spinning-dots"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          display: 'block',
        }}
      >
        {dots.map((dot, index) => (
          <circle
            key={index}
            cx={dot.cx}
            cy={dot.cy}
            r="3.2"
            fill={color}
            opacity={dot.opacity}
          />
        ))}
      </svg>
      <span className="sr-only" style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}>
        {label}
      </span>
    </div>
  );
}

export default LoadingDotsSpinner;
