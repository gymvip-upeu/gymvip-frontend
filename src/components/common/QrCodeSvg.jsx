// ==============================================================================
// GYM VIP — Componente: QrCodeSvg (Renderizador Vectorial de Códigos QR)
// Renderiza la matriz binaria como SVG puro con tokens de diseño Dark & Gold
// ==============================================================================

import React, { useMemo } from 'react';
import { generateQrMatrix } from '../../utils/qrcode.js';

export default function QrCodeSvg({
  value,
  size = 240,
  color = '#D4AF37', // GoldPrimary
  bgColor = '#0E0F12', // DarkBackground
  margin = 2,
  className = '',
  style = {},
}) {
  const { matrix, viewBoxSize } = useMemo(() => {
    if (!value) return { matrix: [], viewBoxSize: 0 };
    try {
      const m = generateQrMatrix(value, 'M');
      return { matrix: m, viewBoxSize: m.length + margin * 2 };
    } catch {
      return { matrix: [], viewBoxSize: 0 };
    }
  }, [value, margin]);

  if (!matrix.length) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8A92A6',
          fontSize: '12px',
          borderRadius: '12px',
          ...style,
        }}
      >
        <span>Generando código QR...</span>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        backgroundColor: bgColor,
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        ...style,
      }}
      shapeRendering="crispEdges"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
      {matrix.map((row, r) =>
        row.map((col, c) =>
          col ? (
            <rect
              key={`${r}-${c}`}
              x={c + margin}
              y={r + margin}
              width={1}
              height={1}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}
