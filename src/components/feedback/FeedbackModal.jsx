// ==============================================================================
// GYM VIP — Componente Reutilizable: Modal Accesible de Mensajes de Estado / Errores
// Cubre: 403 Forbidden, 401 Expirado, 500 Servidor, Red / Conexión, Éxito y Alerta
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Icon } from '../common/Icons';

/**
 * Modal centralizado de feedback para operaciones completadas o bloqueadas.
 * No expone stack traces ni secretos. Soporta teclado (Escape, Enter) y foco accesible.
 */
export function FeedbackModal({
  isOpen = false,
  variant = 'success', // 'success' | 'error' | 'forbidden' | 'network' | 'warning'
  title,
  message,
  onClose,
  actionText = 'Aceptar',
}) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      buttonRef.current?.focus();
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantConfig = () => {
    switch (variant) {
      case 'forbidden':
        return {
          icon: 'shield-check',
          iconColor: 'var(--color-danger, #EF4444)',
          defaultTitle: 'Acceso No Autorizado (403)',
          defaultMessage: 'No dispone de los privilegios requeridos para ejecutar esta operación.',
          badgeColor: 'rgba(239, 68, 68, 0.15)',
        };
      case 'network':
        return {
          icon: 'alert-triangle',
          iconColor: 'var(--color-warning, #F59E0B)',
          defaultTitle: 'Error de Conexión',
          defaultMessage: 'No se pudo comunicar con el servidor central. Verifique su conectividad a la red.',
          badgeColor: 'rgba(245, 158, 11, 0.15)',
        };
      case 'error':
        return {
          icon: 'x-circle',
          iconColor: 'var(--color-danger, #EF4444)',
          defaultTitle: 'Operación No Completada',
          defaultMessage: 'Ocurrió un error al procesar la solicitud en el servidor. Intente nuevamente.',
          badgeColor: 'rgba(239, 68, 68, 0.15)',
        };
      case 'warning':
        return {
          icon: 'alert-triangle',
          iconColor: 'var(--color-warning, #F59E0B)',
          defaultTitle: 'Advertencia del Sistema',
          defaultMessage: 'Por favor, revise la información antes de continuar.',
          badgeColor: 'rgba(245, 158, 11, 0.15)',
        };
      case 'success':
      default:
        return {
          icon: 'check-circle',
          iconColor: 'var(--color-success, #10B981)',
          defaultTitle: 'Operación Exitosa',
          defaultMessage: 'Los datos fueron procesados y confirmados correctamente por el servidor.',
          badgeColor: 'rgba(16, 185, 129, 0.15)',
        };
    }
  };

  const config = getVariantConfig();
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '440px',
          padding: '32px 28px',
          textAlign: 'center',
          borderRadius: 'var(--radius-xl, 16px)',
          background: 'var(--color-surface-panel, #12141A)',
          border: '1px solid var(--color-gold-border, rgba(212, 175, 55, 0.28))',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.85)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono semántico enmarcado */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: config.badgeColor,
            border: `1px solid ${config.iconColor}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
          }}
          aria-hidden="true"
        >
          <Icon name={config.icon} size={28} color={config.iconColor} />
        </div>

        <h3
          id="feedback-modal-title"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-text-primary, #F3F4F6)',
            margin: '0 0 10px 0',
          }}
        >
          {displayTitle}
        </h3>

        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.5,
            color: 'var(--color-text-secondary, #9CA3AF)',
            margin: '0 0 24px 0',
          }}
        >
          {displayMessage}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            ref={buttonRef}
            variant="primary"
            onClick={onClose}
            style={{ minWidth: '140px', minHeight: '42px' }}
          >
            {actionText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;

