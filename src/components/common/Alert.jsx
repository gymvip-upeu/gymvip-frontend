// ==============================================================================
// GYM VIP — Componente Reutilizable: Alert / Toast Accesible (INC-S1-07)
// Soporta alertas inline y notificaciones flotantes superiores derechas con
// autocierre a los 2 minutos (120s) y cierre manual accesible.
// ==============================================================================

import React, { useEffect } from 'react';
import { Icon } from './Icons';

export function Alert({
  variant = 'danger', // 'danger' | 'success' | 'warning' | 'info' | 'forbidden'
  message,
  onClose,
  style,
  floating = false,
  autoClose = false,
  autoCloseDelay = 120000, // 2 minutos (120,000 ms)
  title,
}) {
  if (!message) return null;

  // Por defecto, avisos de éxito o flotantes tienen autocierre a los 2 minutos si hay onClose
  const shouldAutoClose = autoClose || (floating && Boolean(onClose)) || (variant === 'success' && Boolean(onClose));
  const isFloating = floating || variant === 'success' || variant === 'forbidden';

  useEffect(() => {
    if (!shouldAutoClose || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);
    return () => clearTimeout(timer);
  }, [message, shouldAutoClose, autoCloseDelay, onClose]);

  const getIconName = () => {
    switch (variant) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert-triangle';
      case 'forbidden':
        return 'shield-check';
      case 'info':
        return 'bell';
      case 'danger':
      default:
        return 'alert-triangle';
    }
  };

  const getAccentColor = () => {
    switch (variant) {
      case 'success':
        return 'var(--color-success, #10B981)';
      case 'warning':
        return 'var(--color-warning, #F59E0B)';
      case 'forbidden':
      case 'danger':
      default:
        return 'var(--color-danger, #EF4444)';
    }
  };

  const alertClass = `alert alert-${variant === 'forbidden' ? 'danger' : variant} ${isFloating ? 'alert-floating-top-right' : ''}`;

  return (
    <div
      className={alertClass}
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ color: getAccentColor(), marginTop: '2px', flexShrink: 0 }} aria-hidden="true">
          <Icon name={getIconName()} size={18} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {title && (
            <strong style={{ fontSize: '13px', marginBottom: '2px', color: 'var(--color-text-primary)' }}>
              {title}
            </strong>
          )}
          <span style={{ fontSize: '13px', lineHeight: 1.45 }}>{message}</span>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          title="Cerrar notificación"
          className="alert-close-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: 'var(--radius-sm)',
            marginLeft: '8px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Alert;
