// ==============================================================================
// GYM VIP — Logotipo Vectorial Institucional Luxury Dark & Gold
// Componente SVG puro, escalable, con variantes y animación suave de carga
// ==============================================================================

import React from 'react';

/**
 * Logotipo oficial SVG de GYM VIP (VIP CENTER FIT).
 * @param {number} size - Dimensión cuadrada en píxeles (default: 40)
 * @param {'mark' | 'full'} variant - 'mark' (solo emblema) o 'full' (emblema + tipografía)
 * @param {boolean} animated - Activa órbita y brillo pulsante dorado para transiciones y cargas
 * @param {string} className - Clases CSS adicionales
 */
export function GymVipLogo({
  size = 40,
  variant = 'mark',
  animated = false,
  className = '',
  idSuffix = '',
}) {
  const gradId = `gymvip-gold-grad${idSuffix ? `-${idSuffix}` : ''}`;
  const ringGradId = `gymvip-ring-grad${idSuffix ? `-${idSuffix}` : ''}`;

  return (
    <div
      className={`gymvip-logo-container ${animated ? 'gymvip-logo-animated' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: variant === 'full' ? '12px' : '0',
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="gymvip-logo-svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          {/* Gradiente dorado principal */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E498" />
            <stop offset="45%" stopColor="#D4AF37" />
            <stop offset="85%" stopColor="#997A15" />
            <stop offset="100%" stopColor="#E5C158" />
          </linearGradient>

          {/* Gradiente de anillo orbital */}
          <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#F9E498" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#997A15" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Círculo base de fondo oscuro profundo */}
        <circle cx="32" cy="32" r="30" fill="#0E1118" stroke={`url(#${gradId})`} strokeWidth="1.5" />

        {/* Órbita animada externa (visible solo cuando animated = true) */}
        {animated && (
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={`url(#${ringGradId})`}
            strokeWidth="2"
            strokeDasharray="44 132"
            strokeLinecap="round"
            className="gymvip-orbit-ring"
          />
        )}

        {/* Corona superior estilizada */}
        <path
          d="M24 19L27 23L32 17L37 23L40 19L39 25H25L24 19Z"
          fill={`url(#${gradId})`}
        />

        {/* Monograma geométrico "GV" entrelazado */}
        {/* Letra G exterior */}
        <path
          d="M27 27C23.5 27 20 29.8 20 34C20 38.5 23.5 42 28 42C31.5 42 34 39.5 34 36.5H28V33.5H37C37.2 38.8 33.2 45 28 45C21.8 45 16.5 40 16.5 34C16.5 27.5 21.5 23.5 28 23.5C31.5 23.5 34.5 24.8 36.2 26.8L33.8 29.2C32.2 27.8 29.8 27 27 27Z"
          fill={`url(#${gradId})`}
        />

        {/* Letra V central integrada */}
        <path
          d="M36 29L41.5 43H45L50.5 29H46.8L43.2 39.2L39.6 29H36Z"
          fill={`url(#${gradId})`}
        />

        {/* Punto / joya de remate inferior */}
        <circle cx="32" cy="49" r="1.5" fill={`url(#${gradId})`} />
      </svg>

      {variant === 'full' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: `${Math.round(size * 0.44)}px`,
              fontWeight: 900,
              letterSpacing: '1px',
              color: 'var(--color-text-primary, #FFFFFF)',
              lineHeight: 1.05,
            }}
          >
            GYM <b style={{ color: 'var(--color-gold, #D4AF37)' }}>VIP</b>
          </span>
          <span
            style={{
              fontSize: `${Math.max(9, Math.round(size * 0.22))}px`,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--color-gold, #D4AF37)',
              fontWeight: 600,
              marginTop: '2px',
            }}
          >
            VIP CENTER FIT
          </span>
        </div>
      )}
    </div>
  );
}

export default GymVipLogo;
