import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './Button';
import { WhatsAppDialog, WhatsAppTemplateEditor } from './WhatsAppDialogs';
import { MESSAGE_TYPES, readTemplateDrafts, saveTemplateDraft } from '../../services/whatsappCommunications';
import { approveTemplatePreview } from '../../services/templatePreviews';
import { useTemplatePreviews } from '../../hooks/useTemplatePreviews';
import editIcon from '../../assets/icons/whatsapp-edit.svg';
import '../../themes/whatsappCommunications.css';

export default function TrackingTemplates() {
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const [type, setType] = useState(MESSAGE_TYPES[0]);
  const approved = useTemplatePreviews();
  const [drafts, setDrafts] = useState(() => { try { return readTemplateDrafts(); } catch { return {}; } });
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const pending = drafts[type.id] && drafts[type.id] !== approved[type.id];

  function saveDraft(messageType, text) {
    setDrafts(saveTemplateDraft(messageType, text));
    setModal(null);
    setMessage('Borrador guardado. Apruébalo para actualizar la vista previa de Recordatorios.');
  }
  function approve() {
    if (!admin) return;
    try {
      approveTemplatePreview(type);
      setModal(null);
      setMessage('Plantilla aprobada para la vista previa.');
    } catch (failure) { setError(failure.message); }
  }
  return <section aria-label="Plantillas de mensajes">
    <nav className="whatsapp-types" aria-label="Tipos de mensaje">
      {MESSAGE_TYPES.map(item => <Button key={item.id} variant={type.id === item.id ? 'primary' : 'secondary'}
        aria-pressed={type.id === item.id} onClick={() => { setType(item); setMessage(''); setError(''); }}>{item.label}</Button>)}
    </nav>
    <section className="whatsapp-template" aria-label="Plantilla seleccionada">
      <div className="whatsapp-heading">
        <div><h2>Plantilla · Aprobada para vista previa</h2><p className="whatsapp-muted">{type.trigger}</p></div>
        {admin && <Button variant="secondary" className="whatsapp-icon" aria-label="Editar plantilla" onClick={() => { setError(''); setModal('edit'); }}><img src={editIcon} alt="" /></Button>}
      </div>
      <p className="whatsapp-template-text">{approved[type.id]}</p>
      {pending && <div className="whatsapp-actions"><p className="whatsapp-gold">Cambio pendiente de aprobación</p>
        {admin && <Button variant="secondary" onClick={() => { setError(''); setModal('approve'); }}>Revisar y aprobar</Button>}
      </div>}
      {message && <p className="whatsapp-gold" role="status">{message}</p>}
      <p className="whatsapp-muted">Edición y aprobación locales para la vista previa de este navegador. No modifican los envíos del servidor ni la aprobación de Meta.</p>
    </section>
    {admin && modal === 'edit' && <WhatsAppTemplateEditor type={type} savedText={drafts[type.id] || approved[type.id]} onSave={saveDraft} onClose={() => setModal(null)} />}
    {admin && modal === 'approve' && <WhatsAppDialog title="Aprobar para vista previa" width="820px" onClose={() => setModal(null)}>
      <h3>Versión actual</h3><p className="whatsapp-template-text">{approved[type.id]}</p>
      <h3>Cambio propuesto</h3><p className="whatsapp-template-text">{drafts[type.id]}</p>
      <p className="whatsapp-muted">Al aprobar se actualizará la vista previa de Recordatorios en este navegador.</p>
      {error && <p role="alert" className="whatsapp-error">{error}</p>}
      <div className="whatsapp-actions"><Button onClick={approve}>Aprobar plantilla</Button><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button></div>
    </WhatsAppDialog>}
  </section>;
}
