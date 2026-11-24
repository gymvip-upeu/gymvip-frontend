// ==============================================================================
// GYM VIP — Componente de Esqueleto Shimmer Dark & Gold
// Proporciona retroalimentación visual suave durante la carga de métricas y tablas
// ==============================================================================

import React from 'react';
import { Box, keyframes } from '@mui/material';

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export function GoldSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = '6px',
  variant = 'rectangular',
  style = {},
  className = '',
}) {
  return (
    <Box
      className={className}
      sx={{
        width,
        height,
        borderRadius: variant === 'circular' ? '50%' : borderRadius,
        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.03) 25%, rgba(212, 175, 55, 0.12) 50%, rgba(255, 255, 255, 0.03) 75%)',
        backgroundSize: '200% 100%',
        animation: `${shimmer} 1.8s infinite linear`,
        display: 'inline-block',
        ...style,
      }}
    />
  );
}

export default GoldSkeleton;
