import React, { useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import closeIcon from '../../assets/icons/faq-close.svg';

export function FaqDialog({ title, description, onClose, maxWidth = '600px', children }) {
  const content = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    content.current?.querySelector('button')?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const items = content.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]');
    if (!items.length) return;
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault();
      items[items.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
      event.preventDefault();
      items[0].focus();
    }
  }

  return (
    <Modal titleId="faq-dialog-title" maxWidth={maxWidth} onClose={onClose}>
      <div className="faq-dialog" ref={content} onKeyDown={trapFocus}>
        <div className="faq-dialog-heading">
          <h2 id="faq-dialog-title">{title}</h2>
          <button className="faq-icon-button" type="button" aria-label="Cerrar modal" onClick={onClose}>
            <img src={closeIcon} alt="" />
          </button>
        </div>
        <p className="faq-muted">{description}</p>
        {children}
      </div>
    </Modal>
  );
}
