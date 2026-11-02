// ==============================================================================
// GYM VIP — Componente Reutilizable: Badge
// ==============================================================================

import React from 'react';

export function Badge({
  variant = 'gold', // 'gold' | 'success' | 'warning' | 'danger' | 'neutral'
  className = '',
  style,
  children,
}) {
  const variantClass = `badge-${variant}`;
  return (
    <span className={`badge ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  );
}

export default Badge;
