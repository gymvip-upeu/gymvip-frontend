import React, { useEffect, useRef } from 'react';
export default function MemberDialog({ title, subtitle, onClose, busy = false, children, wide = false }) {
  const root = useRef(null), callback = useRef(onClose), locked = useRef(busy);
  callback.current = onClose; locked.current = busy;
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (root.current.querySelector('input,select,textarea') || root.current.querySelector('button'))?.focus();
    const keys = e => {
      if (e.key === 'Escape' && !locked.current) { e.preventDefault(); callback.current(); }
      if (e.key !== 'Tab') return;
      const controls = [...root.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')];
      if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1)?.focus(); }
      if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0]?.focus(); }
    };
    document.addEventListener('keydown', keys);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keys); previous?.focus(); };
  }, []);
  return <div className="modal-overlay member-overlay"><div ref={root} className={`modal-content member-dialog ${wide ? 'member-dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="member-dialog-title"><header><div><h2 id="member-dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="member-close" onClick={onClose} disabled={busy} aria-label="Cerrar formulario">×</button></header>{children}</div></div>;
}
