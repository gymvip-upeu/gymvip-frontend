// ==============================================================================
// GYM VIP — Componente Reutilizable: Diálogo de Confirmación Accesible
// Para acciones irreversibles: desactivar miembro, dar de baja plan, cancelar periodo
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Icon } from '../common/Icons';

export function ConfirmDialog({
  isOpen = false,
  title = '¿Confirmar operación?',
  message = 'Esta acción modificará el estado del registro en la base de datos.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !loading && onCancel) {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      cancelBtnRef.current?.focus();
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={!loading ? onCancel : undefined}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '460px',
          padding: '28px',
          borderRadius: 'var(--radius-xl, 16px)',
          background: 'var(--color-surface-panel, #12141A)',
          border: '1px solid var(--color-gold-border, rgba(212, 175, 55, 0.28))',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.85)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${isDanger ? 'var(--color-danger, #EF4444)' : 'var(--color-warning, #F59E0B)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <Icon
              name={isDanger ? 'alert-triangle' : 'alert-circle'}
              size={22}
              color={isDanger ? 'var(--color-danger)' : 'var(--color-warning)'}
            />
          </div>

          <div style={{ flex: 1 }}>
            <h3
              id="confirm-dialog-title"
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--color-text-primary, #F3F4F6)',
                margin: '0 0 8px 0',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--color-text-secondary, #9CA3AF)',
                margin: 0,
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '28px',
          }}
        >
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

