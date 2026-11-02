// ==============================================================================
// GYM VIP — Modal Accesible de Notificaciones (Función Futura)
// Muestra el estado vacío honesto sin inventar alertas ficticias
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { Icon } from './Icons';

export function NotificationsModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Cierre accesible con Escape y foco automático
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Foco accesible al abrir
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="modal-content notifications-dialog"
        style={{
          maxWidth: '440px',
          padding: '24px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">
              <Icon name="bell" size={20} />
            </span>
            <h2 id="notifications-title" style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Notificaciones
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="btn-action-icon"
            onClick={onClose}
            aria-label="Cerrar notificaciones"
            title="Cerrar notificaciones"
          >
            <Icon name="x-circle" size={18} />
          </button>
        </div>

        {/* Estado Vacío Honesto para Función Futura */}
        <div style={{ textAlign: 'center', padding: '28px 12px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-gold-subtle)',
              border: '1px solid var(--color-gold-border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              color: 'var(--color-gold)',
            }}
            aria-hidden="true"
          >
            <Icon name="bell" size={26} />
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
            Aún no hay notificaciones disponibles
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Este módulo se encuentra preparado para recibir en tiempo real avisos de membresías por vencer, ingresos al gimnasio y alertas del sistema.
          </p>

          <span
            className="badge badge-gold"
            style={{ fontSize: '11px', padding: '4px 10px', letterSpacing: '0.5px' }}
          >
            MÓDULO EN PREPARACIÓN PARA SPRINT FUTURO
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationsModal;

