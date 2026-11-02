// ==============================================================================
// GYM VIP — Componente Reutilizable: Alert
// ==============================================================================

import React from 'react';

export function Alert({
  variant = 'danger', // 'danger' | 'success' | 'warning'
  message,
  onClose,
  style,
}) {
  if (!message) return null;
  const icon = variant === 'success' ? '✓' : variant === 'warning' ? '⚡' : '⚠️';
  const alertClass = `alert alert-${variant}`;

  return (
    <div className={alertClass} role="alert" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...style }}>
      <span>{icon} {message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Alert;
