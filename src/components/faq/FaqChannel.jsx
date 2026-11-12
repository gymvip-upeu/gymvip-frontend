import React, { useState } from 'react';
import { Button } from '../common/Button';
import { useFaqCatalog } from '../../hooks/useFaqCatalog';
import { FAQ_CATEGORIES, filterFaqCatalog, matchFaqMessage } from '../../services/faqCatalog';
import '../../themes/faq.css';

export function FaqChannel({ mode }) {
  const whatsapp = mode === 'whatsapp';
  const { records, error, refresh } = useFaqCatalog();
  const published = records.filter(({ active }) => active);
  const [view, setView] = useState('catalog');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [incoming, setIncoming] = useState('');
  const current = published.find(({ id }) => id === selected);

  function open(record, message = '') {
    setIncoming(message);
    setSelected(record.id);
    setView('answer');
  }

  function search(event) {
    event.preventDefault();
    if (!query.trim()) return;
    if (!whatsapp) {
      setView('results');
      return;
    }
    const found = matchFaqMessage(published, query);
    setIncoming(query.trim());
    if (found.length === 1) {
      open(found[0], query.trim());
    } else {
      setMatches(found.map(({ id }) => id));
      setView(found.length ? 'ambiguous' : 'empty');
    }
  }

  const cards = (items, message = '') => (
    <div className="faq-channel-list">
      {items.map((item) => (
        <button type="button" className="faq-question" key={item.id} onClick={() => open(item, message)}>
          <strong>{item.content.question}</strong>
          <span>{item.content.category}</span>
        </button>
      ))}
    </div>
  );

  if (error) {
    return (
      <section className="faq-channel">
        <h2>Preguntas frecuentes</h2>
        <p role="alert">{error}</p>
        <Button onClick={refresh}>Volver a consultar</Button>
      </section>
    );
  }

  const availableChoices = view === 'topic' ? published.filter(({ content }) => content.category === topic)
    : view === 'ambiguous' ? published.filter(({ id }) => matches.includes(id))
      : filterFaqCatalog(published, query);
  const showEmpty = view === 'empty' || (['topic', 'ambiguous', 'results'].includes(view) && !availableChoices.length)
    || (view === 'answer' && !current);

  return (
    <section className="faq-channel" aria-label={whatsapp ? 'Simulación de WhatsApp' : 'Catálogo para miembros'}>
      {whatsapp && <p className="faq-gold">WhatsApp · VIP Center Fit · Simulación</p>}
      {view === 'catalog' ? (
        <>
          <h2>{whatsapp ? '¿En qué te ayudamos?' : 'Preguntas frecuentes'}</h2>
          <p className="faq-muted">{whatsapp ? 'Selecciona un tema o escribe tu consulta.' : 'Catálogo para miembros autenticados.'}</p>
          {whatsapp ? (
            <div className="faq-channel-list">
              {FAQ_CATEGORIES.map((category) => (
                <Button key={category} variant="secondary" onClick={() => { setTopic(category); setView('topic'); }}>{category}</Button>
              ))}
              <Button variant="secondary" onClick={() => setView('search')}>Escribir una consulta</Button>
            </div>
          ) : (
            <>
              <Button onClick={() => setView('search')}>Buscar por palabra</Button>
              {published.length ? cards(published) : <p className="faq-muted">Por ahora no hay preguntas publicadas.</p>}
            </>
          )}
          <Button variant={whatsapp ? 'primary' : 'secondary'} onClick={() => setView('contact')}>Hablar con recepción</Button>
        </>
      ) : view === 'search' ? (
        <>
          <h2>{whatsapp ? 'Escribe tu consulta' : 'Buscar preguntas'}</h2>
          <form className="faq-channel-list" onSubmit={search}>
            <label className="faq-field">
              {whatsapp ? 'Tu mensaje' : 'Palabra clave'}
              <input className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus required />
            </label>
            <Button type="submit">{whatsapp ? 'Consultar' : 'Buscar'}</Button>
          </form>
          <Button variant="secondary" onClick={() => setView('catalog')}>{whatsapp ? 'Volver al menú' : 'Volver al catálogo'}</Button>
        </>
      ) : showEmpty ? (
        <>
          <h2>{whatsapp ? 'No encontramos respuesta' : 'Sin resultados'}</h2>
          <p className="faq-muted">Puedes elegir otro tema o pedir ayuda a recepción.</p>
          <Button onClick={() => setView('contact')}>Hablar con recepción</Button>
          <Button variant="secondary" onClick={() => setView('search')}>Buscar otra pregunta</Button>
          <Button variant="secondary" onClick={() => setView('catalog')}>{whatsapp ? 'Volver al menú' : 'Volver al catálogo'}</Button>
        </>
      ) : view === 'answer' ? (
        <>
          <h2>{whatsapp ? 'Respuesta del gimnasio' : 'Respuesta'}</h2>
          {incoming && <div className="faq-question"><strong>Tu consulta</strong><span>{incoming}</span></div>}
          <div className="faq-question">
            <strong>{current.content.question}</strong>
            <p className="faq-answer">{current.content.answer}</p>
          </div>
          <Button onClick={() => setView('catalog')}>{whatsapp ? 'Ver otros temas' : 'Volver al catálogo'}</Button>
          <Button variant="secondary" onClick={() => setView('contact')}>Hablar con recepción</Button>
        </>
      ) : view === 'contact' || view === 'handoff' ? (
        <>
          <h2>{view === 'handoff' ? 'Derivación simulada' : 'Hablar con recepción'}</h2>
          <p className="faq-muted">{view === 'handoff'
            ? 'En un canal conectado, la consulta pasaría al equipo de recepción.'
            : 'Recepción puede ayudarte con dudas sobre tu membresía o los servicios del gimnasio.'}</p>
          {whatsapp && view === 'contact' && <Button onClick={() => setView('handoff')}>Simular solicitud de atención</Button>}
          <Button variant="secondary" onClick={() => setView('catalog')}>{whatsapp ? 'Volver al menú' : 'Volver al catálogo'}</Button>
        </>
      ) : (
        <>
          <h2>{view === 'ambiguous' ? 'Aclaremos tu consulta' : view === 'topic' ? 'Preguntas por tema' : 'Resultados'}</h2>
          {view === 'topic' && <p className="faq-gold">{topic}</p>}
          {view === 'ambiguous' && <div className="faq-question"><strong>Tu mensaje</strong><span>{incoming}</span></div>}
          {cards(availableChoices, view === 'ambiguous' ? incoming : '')}
          <Button variant="secondary" onClick={() => setView('catalog')}>{whatsapp ? 'Volver al menú' : 'Volver al catálogo'}</Button>
          <Button variant="secondary" onClick={() => setView('contact')}>Hablar con recepción</Button>
        </>
      )}
    </section>
  );
}
