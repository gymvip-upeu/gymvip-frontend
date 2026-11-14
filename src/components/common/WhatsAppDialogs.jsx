import React, { useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import {
  TEMPLATE_VARIABLES, formatAttemptDate, requiredVariables, validateTemplate,
} from '../../services/whatsappCommunications';
import closeIcon from '../../assets/icons/whatsapp-close.svg';

export function WhatsAppDialog({ title, width, onClose, children }) {
  const titleId = useId();
  const panel = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector('button')?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  function keepFocus(event) {
    if (event.key !== 'Tab') return;
    const elements = [...panel.current.querySelectorAll('button:not(:disabled), textarea, a[href]')];
    const edge = event.shiftKey ? elements[0] : elements.at(-1);
    if (document.activeElement !== edge) return;
    event.preventDefault();
    (event.shiftKey ? elements.at(-1) : elements[0])?.focus();
  }

  return (
    <Modal titleId={titleId} maxWidth={width} onClose={onClose}>
      <div className="whatsapp-dialog" ref={panel} onKeyDown={keepFocus}>
        <header className="whatsapp-heading">
          <h2 id={titleId}>{title}</h2>
          <Button variant="secondary" className="whatsapp-icon" aria-label="Cerrar modal" onClick={onClose}>
            <img src={closeIcon} alt="" />
          </Button>
        </header>
        {children}
      </div>
    </Modal>
  );
}

export function WhatsAppTemplateEditor({ type, savedText, onSave, onClose }) {
  const [text, setText] = useState(savedText || type.original);
  const [error, setError] = useState('');
  const input = useRef(null);
  const labelId = useId();
  const helpId = useId();

  function updateText(value) {
    setText(value);
    setError('');
  }

  function insertVariable(name) {
    const token = `{${name}}`;
    const { selectionStart, selectionEnd } = input.current;
    updateText(text.slice(0, selectionStart) + token + text.slice(selectionEnd));
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(selectionStart + token.length, selectionStart + token.length);
    });
  }

  function save(event) {
    event.preventDefault();
    const validation = validateTemplate(type, text);
    if (validation) {
      setError(validation);
      input.current.focus();
      return;
    }
    try {
      onSave(type, text);
    } catch {
      setError('No se pudo guardar el borrador en este navegador. El texto sigue disponible.');
    }
  }

  return (
    <WhatsAppDialog title="Editar plantilla" width="820px" onClose={onClose}>
      <form className="whatsapp-editor" onSubmit={save}>
        <label htmlFor={labelId} className="whatsapp-gold">{type.label}</label>
        <textarea id={labelId} ref={input} value={text} onChange={event => updateText(event.target.value)}
          aria-label={`Mensaje de ${type.label}`} aria-describedby={helpId} aria-invalid={Boolean(error)} />
        <div id={helpId}>
          <strong>Datos obligatorios</strong>
          <p className="whatsapp-gold">{requiredVariables(type).map(name => `{${name}}`).join(', ')}</p>
          <p className="whatsapp-muted">Inserta las variables en el texto. Se completarán con los datos del envío.</p>
        </div>
        <div className="whatsapp-actions">
          {TEMPLATE_VARIABLES.filter(name => requiredVariables(type).includes(name) || name === 'detalle')
            .map(name => <Button key={name} variant="secondary" onClick={() => insertVariable(name)}>{`{${name}}`}</Button>)}
        </div>
        {error && <p className="whatsapp-error" role="alert">{error}</p>}
        <footer className="whatsapp-heading whatsapp-editor-footer">
          <div className="whatsapp-actions">
            <Button variant="secondary" onClick={() => updateText(type.original)}>Restaurar original</Button>
            <Button variant="secondary" onClick={() => { updateText(''); input.current.focus(); }}>Limpiar texto</Button>
          </div>
          <div className="whatsapp-actions">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </footer>
      </form>
    </WhatsAppDialog>
  );
}

export function WhatsAppDispatchDetail({ row, type, canRetry, onRetry, onClose }) {
  return (
    <WhatsAppDialog title="Detalle del envío" width="704px" onClose={onClose}>
      <section className="whatsapp-detail-card">
        <strong>{row.clientName || 'Destinatario'}</strong>
        <p>{row.recipientMasked || 'Número no disponible'}</p>
      </section>
      <strong className="whatsapp-gold">{type.label}</strong>
      <p>{row.detail}</p>
      <section className="whatsapp-detail-card">
        <strong>{row.statusLabel}</strong>
        {row.errorMessage && <p>{row.errorMessage}</p>}
        {row.attemptCount != null && <p>Intentos registrados · {row.attemptCount}</p>}
        {[
          ['Registrado', row.createdAt], ['Enviado', row.sentAt],
          ['Entregado', row.deliveredAt], ['Leído', row.readAt],
        ].map(([label, value]) => {
          const formatted = formatAttemptDate(value);
          return formatted && <p key={label}>{label} · {formatted}</p>;
        })}
        {row.requestId && <p>Solicitud · {row.requestId}</p>}
        {row.externalMessageId && <p>Referencia del proveedor · {row.externalMessageId}</p>}
      </section>
      <section className="whatsapp-detail-card">
        <strong>Plantilla utilizada</strong>
        <p>{row.templateText || row.templateName || 'Sin identificación de plantilla'}</p>
      </section>
      <div className="whatsapp-actions">
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        {canRetry && <Button onClick={onRetry}>Reintentar envío</Button>}
      </div>
    </WhatsAppDialog>
  );
}
