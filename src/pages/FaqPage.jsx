import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../components/common/Button';
import { FaqDialog } from '../components/faq/FaqDialog';
import { FaqChannel } from '../components/faq/FaqChannel';
import { useAuth } from '../contexts/AuthContext';
import { useFaqCatalog } from '../hooks/useFaqCatalog';
import { FAQ_CATEGORIES, FAQ_FILTERS, faqStatus, filterFaqCatalog, normalizeFaqText, saveFaq } from '../services/faqCatalog';
import searchIcon from '../assets/icons/faq-search.svg';
import filterIcon from '../assets/icons/faq-filter.svg';
import closeIcon from '../assets/icons/faq-close.svg';
import switchOn from '../assets/icons/faq-switch-on.svg';
import switchOff from '../assets/icons/faq-switch-off.svg';
import '../themes/faq.css';

const STATUS_OPTIONS = [['', 'Todos'], ['active', 'Activa'], ['inactive', 'Inactiva'], ['pending', 'Pendiente']];
const EMPTY_FORM = { category: '', question: '', answer: '' };

function Notice({ title, children, error = false }) {
  return (
    <div className={`faq-notice ${error ? 'faq-notice--error' : ''}`} role={error ? 'alert' : 'status'}>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

function ContentPanel({ heading, content, children }) {
  return (
    <section className="faq-panel">
      <h2>{heading || content.question}</h2>
      {heading && <strong>{content.question}</strong>}
      <p className="faq-muted">{content.category}</p>
      <p className="faq-answer">{content.answer}</p>
      {children}
    </section>
  );
}

function FilterDialog({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  return (
    <FaqDialog title="Filtrar respuestas" description="Selecciona una categoría y un estado para acotar el listado." onClose={onClose} maxWidth="640px">
      {[
        ['category', 'Categoría', [['', 'Todas'], ...FAQ_CATEGORIES.map((category) => [category, category])]],
        ['status', 'Estado', STATUS_OPTIONS],
      ].map(([field, title, options]) => (
        <fieldset className={`faq-filter-options faq-filter-options--${field}`} key={field}>
          <legend>{title}</legend>
          {options.map(([value, label]) => (
            <Button key={value} variant={draft[field] === value ? 'primary' : 'secondary'} aria-pressed={draft[field] === value}
              onClick={() => setDraft((previous) => ({ ...previous, [field]: value }))}>
              {draft[field] === value && <span aria-hidden="true">✓</span>}{label}
            </Button>
          ))}
        </fieldset>
      ))}
      <div className="faq-actions">
        <Button onClick={() => onApply(draft)}>Aplicar filtros</Button>
        <Button variant="secondary" onClick={() => setDraft(FAQ_FILTERS)}>Limpiar filtros</Button>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </FaqDialog>
  );
}

export default function FaqPage() {
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const { records, error: loadError, refresh } = useFaqCatalog();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(FAQ_FILTERS);
  const [modal, setModal] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const [failure, setFailure] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const [message, setMessage] = useState('');
  const heading = useRef(null);
  const record = records.find((item) => item.id === selectedId);
  const filtered = filterFaqCatalog(records, search, filters);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [view]);

  function open(next, item) {
    if (item) setSelectedId(item.id);
    setFailure(null);
    setInvalid(false);
    setMessage('');
    setView(next);
  }

  function edit(item = null) {
    setEditRecord(item);
    setForm(item ? item.proposal || item.content : EMPTY_FORM);
    open('form', item);
  }

  function save(event) {
    event.preventDefault();
    setFailure(null);
    const incomplete = !form.category || !normalizeFaqText(form.question) || !form.answer.trim();
    setInvalid(incomplete);
    if (incomplete) return;
    try {
      const updated = saveFaq({ action: editRecord ? 'edit' : 'create', record: editRecord, values: form }, admin ? 'ADMIN' : 'RECEPCION');
      open('saved', updated);
    } catch (error) {
      if (error.duplicate) {
        setDuplicate(error.duplicate);
        open('duplicate');
      } else {
        setFailure(error.message);
      }
    }
  }

  function changeAvailability(action) {
    try {
      const updated = saveFaq({ action, record }, admin ? 'ADMIN' : 'RECEPCION');
      setModal(null);
      open('detail', updated);
      setMessage(action === 'deactivate' ? 'Respuesta desactivada' : 'Respuesta publicada');
    } catch (error) {
      setFailure(error.message);
    }
  }

  const headings = {
    list: ['Respuestas frecuentes', 'Consulta y gestiona el catálogo para la aplicación y la simulación de WhatsApp.'],
    form: [editRecord ? 'Editar respuesta' : 'Nueva respuesta', 'Los campos marcados con * son obligatorios.'],
    detail: ['Detalle de respuesta frecuente', 'Consulta el contenido y su estado en el catálogo.'],
    duplicate: ['Ya existe una pregunta equivalente', 'Usa el registro existente para mantener una sola respuesta por consulta.'],
    saved: [record?.proposal ? 'Cambio pendiente de aprobación' : 'Respuesta guardada', record?.proposal ? 'El cambio quedó guardado para revisión.' : 'El contenido quedó registrado como inactivo.'],
    review: ['Revisar cambio pendiente', 'Compara la versión aprobada con la propuesta antes de publicarla.'],
    member: ['Vista del miembro', 'Consulta las respuestas activas del catálogo local.'],
    whatsapp: ['Simulación de WhatsApp', 'Prueba el menú de temas y la atención automática con el catálogo local.'],
  };
  const [title, subtitle] = headings[view];

  return (
    <div className="faq-page">
      <p className="faq-breadcrumb">VIP CENTER FIT <span>/</span> Comunicaciones <span>/</span> Respuestas frecuentes</p>
      <header className="faq-title">
        <h1 tabIndex={-1} ref={heading}>{title}</h1>
        <p>{subtitle}</p>
      </header>
      {message && <Notice title={message}>El catálogo local está actualizado.</Notice>}
      {loadError ? (
        <>
          <Notice title="No se pudo consultar el catálogo" error>{loadError}</Notice>
          <div className="faq-actions"><Button onClick={refresh}>Volver a consultar</Button></div>
        </>
      ) : view === 'list' ? (
        <>
          <div className="faq-toolbar">
            <form className="faq-search" onSubmit={(event) => { event.preventDefault(); setSearch(query); }}>
              <input type="search" value={query} placeholder="Buscar por palabras clave" aria-label="Buscar por palabras clave"
                onChange={(event) => { setQuery(event.target.value); if (!event.target.value) setSearch(''); }} />
              <button className="faq-icon-button" type="submit" aria-label="Buscar"><img src={searchIcon} alt="" /></button>
            </form>
            <button className="faq-icon-button" type="button" aria-label="Filtrar por categoría o estado" onClick={() => setModal('filter')}><img src={filterIcon} alt="" /></button>
            <Button onClick={() => edit()}>Nueva respuesta</Button>
            <Button variant="secondary" onClick={() => setMessage(refresh() ? 'Catálogo actualizado' : '')}>Actualizar</Button>
          </div>
          {(filters.category || filters.status) && (
            <div className="faq-applied">
              <span>Filtros: {[filters.category, STATUS_OPTIONS.find(([key]) => key === filters.status)?.[1]].filter(Boolean).join(' · ')}</span>
              <button type="button" onClick={() => setFilters(FAQ_FILTERS)}>Quitar filtros</button>
            </div>
          )}
          {filtered.length ? (
            <div className="faq-table-wrap" tabIndex={0} aria-label="Catálogo de respuestas">
              <table className="faq-table">
                <thead><tr>{['Pregunta', 'Categoría', 'Estado', 'Acciones'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
                <tbody>{filtered.map((item) => (
                  <tr key={item.id}>
                    <th scope="row">{item.content.question}</th>
                    <td>{item.content.category}</td>
                    <td>{faqStatus(item)}</td>
                    <td><div className="faq-row-actions">
                      <button type="button" onClick={() => open('detail', item)}>Ver respuesta</button>
                      <button type="button" onClick={() => edit(item)}>Editar</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <Notice title="Sin resultados">Prueba otra palabra, categoría o estado.</Notice>}
          <Notice title={admin ? 'Publicación' : 'Permisos de recepción'}>
            {admin ? 'Abre una respuesta para revisar el contenido y administrar su disponibilidad.' : 'Puedes crear y editar. La publicación y los cambios de estado corresponden al administrador.'}
          </Notice>
          <div className="faq-demo">
            <p>Catálogo de demostración guardado en este navegador.</p>
            <div className="faq-actions">
              <Button variant="secondary" onClick={() => open('member')}>Vista del miembro</Button>
              <Button variant="secondary" onClick={() => open('whatsapp')}>Simular WhatsApp</Button>
            </div>
          </div>
        </>
      ) : view === 'form' ? (
        <form className="faq-form" onSubmit={save}>
          {invalid && <Notice title="Completa los campos obligatorios" error>Ingresa una categoría, una pregunta y una respuesta.</Notice>}
          {failure && <Notice title="No se pudo guardar la respuesta" error>{failure} Los datos ingresados se conservan.</Notice>}
          <section className="faq-panel">
            <h2>Pregunta y respuesta</h2>
            <label className="faq-field">Categoría *
              <select className="form-input" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="">Selecciona una categoría</option>
                {FAQ_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="faq-field">Pregunta *
              <input className="form-input" required placeholder="Escribe una pregunta" value={form.question}
                onChange={(event) => setForm({ ...form, question: event.target.value })} />
            </label>
            <label className="faq-field">Respuesta *
              <textarea className="form-input" rows={4} required placeholder="Escribe una respuesta" value={form.answer}
                onChange={(event) => setForm({ ...form, answer: event.target.value })} />
            </label>
            <p className="faq-muted">Cada entrada debe resolver una sola consulta.</p>
            {editRecord?.active && <p className="faq-gold">La versión aprobada seguirá disponible mientras se revisa el cambio.</p>}
          </section>
          <div className="faq-actions">
            <Button type="submit">{failure ? 'Reintentar guardado' : editRecord ? 'Guardar edición' : 'Guardar respuesta'}</Button>
            <Button variant="secondary" onClick={() => open('list')}>Cancelar</Button>
          </div>
        </form>
      ) : view === 'duplicate' ? (
        <>
          <Notice title="Pregunta duplicada" error>Ya existe una pregunta con el mismo texto normalizado.</Notice>
          <ContentPanel heading="Registro existente" content={duplicate.content} />
          <div className="faq-actions">
            <Button onClick={() => edit(duplicate)}>Editar respuesta existente</Button>
            <Button variant="secondary" onClick={() => open('form')}>Volver al formulario</Button>
          </div>
        </>
      ) : view === 'member' || view === 'whatsapp' ? (
        <>
          <FaqChannel mode={view} />
          <div className="faq-actions"><Button variant="secondary" onClick={() => open('list')}>Volver al listado</Button></div>
        </>
      ) : !record ? (
        <>
          <Notice title="Respuesta no disponible" error>Vuelve al listado para consultar el catálogo actual.</Notice>
          <div className="faq-actions"><Button onClick={() => open('list')}>Volver al listado</Button></div>
        </>
      ) : view === 'review' && admin && record.proposal ? (
        <>
          {failure && <Notice title="No se pudo publicar" error>{failure}</Notice>}
          <div className="faq-compare">
            <ContentPanel heading="Versión aprobada" content={record.content} />
            <ContentPanel heading="Propuesta pendiente" content={record.proposal} />
          </div>
          <Notice title="Publicación en el catálogo">La vista del miembro y la simulación de WhatsApp usarán la propuesta aprobada.</Notice>
          <div className="faq-actions">
            <Button onClick={() => changeAvailability('publish')}>Publicar cambio</Button>
            <Button variant="secondary" onClick={() => open('detail', record)}>Volver sin publicar</Button>
          </div>
        </>
      ) : view === 'saved' ? (
        <>
          {record.proposal && <Notice title="La versión vigente sigue publicada">El catálogo seguirá mostrando la respuesta aprobada hasta que un administrador publique el cambio.</Notice>}
          <ContentPanel heading={record.proposal ? 'Propuesta guardada' : 'Contenido guardado'} content={record.proposal || record.content} />
          <div className="faq-actions">
            {admin && <Button onClick={() => open(record.proposal ? 'review' : 'detail', record)}>{record.proposal ? 'Revisar propuesta' : 'Revisar para activar'}</Button>}
            <Button variant="secondary" onClick={() => open('list')}>Volver al listado</Button>
          </div>
        </>
      ) : (
        <>
          <ContentPanel content={record.content}>
            <p className="faq-gold">{faqStatus(record)}</p>
            {admin && (
              <div className="faq-availability">
                <span>Disponibilidad en app y WhatsApp</span>
                <button type="button" className="faq-switch" role="switch" aria-label="Disponibilidad en app y WhatsApp" aria-checked={record.active}
                  onClick={() => { setFailure(null); setModal(record.active ? 'deactivate' : 'activate'); }}>
                  <img src={record.active ? switchOn : switchOff} alt="" />
                </button>
              </div>
            )}
          </ContentPanel>
          <div className="faq-actions">
            <Button onClick={() => edit(record)}>Editar respuesta</Button>
            <Button variant="secondary" onClick={() => open('list')}>Volver al listado</Button>
          </div>
          {admin && record.proposal && <div className="faq-actions"><Button variant="secondary" onClick={() => open('review', record)}>Revisar cambio pendiente</Button></div>}
        </>
      )}
      {modal === 'filter' && (
        <FilterDialog filters={filters} onClose={() => setModal(null)}
          onApply={(next) => { setFilters(next); setSearch(query); setModal(null); }} />
      )}
      {admin && record && (modal === 'activate' || modal === 'deactivate') && (
        <FaqDialog title={modal === 'activate' ? 'Activar respuesta' : 'Desactivar respuesta'}
          description={modal === 'activate' ? 'Revisa el contenido para la vista del miembro y la simulación de WhatsApp.' : 'Confirma antes de retirarla de los canales de atención.'}
          onClose={() => { setModal(null); setFailure(null); }}>
          <Notice title={record.content.question}>
            {modal === 'activate' ? record.content.answer : 'Dejará de aparecer en la app y de usarse en nuevas respuestas automáticas. El registro seguirá disponible en el catálogo interno.'}
          </Notice>
          {failure && <Notice title="No se pudo actualizar la disponibilidad" error>{failure}</Notice>}
          <div className="faq-actions">
            <Button onClick={() => changeAvailability(modal)}>{modal === 'activate' ? 'Activar y publicar' : 'Confirmar desactivación'}</Button>
            <Button variant="secondary" onClick={() => { setModal(null); setFailure(null); }}>Cancelar</Button>
          </div>
        </FaqDialog>
      )}
    </div>
  );
}
