// ==============================================================================
// GYM VIP — Componente Reutilizable: Modal Accesible
// ==============================================================================

import React, { useEffect } from 'react';

export function Modal({
  isOpen = true,
  onClose,
  titleId,
  maxWidth = '480px',
  children,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div
        className="modal-content"
        style={{ maxWidth, padding: '32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
