export const FAQ_CATEGORIES = ['Horarios', 'Membresías', 'Renovaciones', 'Servicios', 'Suplementos'];
export const FAQ_FILTERS = { category: '', status: '' };

const STORAGE_KEY = 'gymvip.faq-catalog.v1';
const CHANGE_EVENT = 'gymvip:faq-catalog';
const SEED = [
  ['holiday', 'Horarios', '¿Atienden los feriados?', 'En feriados atendemos de 8:00 a. m. a 12:00 p. m. Consulta en recepción si hay un horario especial.'],
  ['renew', 'Renovaciones', '¿Cómo renuevo mi membresía?', 'Acércate a recepción para consultar los planes vigentes y confirmar tu renovación.'],
  ['supplement', 'Suplementos', '¿Dónde consulto los suplementos disponibles?', 'Consulta el catálogo vigente en la app para ver los productos y su disponibilidad.'],
  ['pricing', 'Membresías', '¿Dónde puedo consultar los precios de los planes?', 'Consulta los planes vigentes en la app o pide a recepción que te explique las opciones disponibles.'],
  ['service', 'Servicios', '¿Qué servicios ofrece el gimnasio?', 'Recepción puede explicarte qué servicios incluye cada plan y ayudarte a coordinar una visita.'],
];

export function normalizeFaqText(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function validContent(content) {
  return content && FAQ_CATEGORIES.includes(content.category)
    && typeof content.question === 'string' && Boolean(normalizeFaqText(content.question))
    && typeof content.answer === 'string' && Boolean(content.answer.trim());
}

function validRecord(record) {
  return record && typeof record.id === 'string' && typeof record.active === 'boolean'
    && Number.isInteger(record.revision) && record.revision > 0 && validContent(record.content)
    && (record.proposal === null || validContent(record.proposal));
}

export function readFaqCatalog() {
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === null) {
    return SEED.map(([id, category, question, answer]) => ({
      id, content: { category, question, answer }, active: true, proposal: null, revision: 1,
    }));
  }
  const records = JSON.parse(value);
  if (!Array.isArray(records) || !records.every(validRecord) || new Set(records.map(({ id }) => id)).size !== records.length) {
    throw new Error('El catálogo guardado tiene un formato inválido.');
  }
  return records;
}

export function watchFaqCatalog(listener) {
  function onStorage(event) {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  }
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function writeCatalog(records) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function validateUnique(records, content, id) {
  if (!validContent(content)) throw new Error('Completa la categoría, la pregunta y la respuesta.');
  const question = normalizeFaqText(content.question);
  const duplicate = records.find((record) => record.id !== id && [record.content, record.proposal]
    .some((version) => version && normalizeFaqText(version.question) === question));
  if (duplicate) {
    const error = new Error('Ya existe una pregunta equivalente.');
    error.duplicate = duplicate;
    throw error;
  }
}

export function saveFaq({ action, record, values }, role) {
  const editingContent = action === 'create' || action === 'edit';
  if (role !== 'ADMIN' && !(role === 'RECEPCION' && editingContent)) {
    throw new Error('Solo administración puede publicar o cambiar la disponibilidad.');
  }
  const records = readFaqCatalog();
  const current = record && records.find((item) => item.id === record.id);
  if (action !== 'create' && (!current || current.revision !== record?.revision)) {
    throw new Error('La respuesta cambió en otra vista. Vuelve al listado y abre la versión actual.');
  }

  let updated;
  if (editingContent) {
    const content = { category: values.category, question: values.question.trim(), answer: values.answer.trim() };
    validateUnique(records, content, current?.id);
    if (action === 'create') {
      updated = { id: crypto.randomUUID(), content, active: false, proposal: null, revision: 1 };
    } else if (current.active) {
      updated = { ...current, proposal: content };
    } else {
      updated = { ...current, content, proposal: null };
    }
  } else if (action === 'publish' && current.proposal) {
    validateUnique(records, current.proposal, current.id);
    updated = { ...current, content: current.proposal, active: true, proposal: null };
  } else if (action === 'activate' || action === 'deactivate') {
    updated = { ...current, active: action === 'activate' };
  } else {
    throw new Error('La respuesta no tiene un cambio pendiente de publicación.');
  }

  if (current) updated.revision = current.revision + 1;
  writeCatalog(current ? records.map((item) => item.id === current.id ? updated : item) : [...records, updated]);
  return updated;
}

export function faqStatus(record) {
  if (!record.active) return record.proposal ? 'Inactiva · Cambio pendiente' : 'Inactiva';
  return record.proposal ? 'Activa · Cambio pendiente' : 'Activa';
}

export function filterFaqCatalog(records, query, filters = FAQ_FILTERS) {
  const terms = normalizeFaqText(query).split(' ').filter(Boolean);
  return records.filter((record) => {
    const { category, question, answer } = record.content;
    const searchable = normalizeFaqText(`${question} ${category} ${answer}`);
    return (!filters.category || filters.category === category)
      && (!filters.status || (filters.status === 'pending' && record.proposal)
        || (filters.status === 'active' && record.active) || (filters.status === 'inactive' && !record.active))
      && terms.every((term) => searchable.includes(term));
  });
}

const APPROVED_PHRASES = {
  holiday: ['abren en días festivos', 'horario en feriados'],
  renew: ['cómo puedo renovar', 'quiero saber de mi plan'],
  pricing: ['cuánto cuesta la membresía', 'quiero saber de mi plan'],
  supplement: ['qué suplementos tienen'],
  service: ['qué servicios incluye el gimnasio'],
};

export function matchFaqMessage(records, message) {
  const query = normalizeFaqText(message);
  if (!query) return [];
  const published = records.filter(({ active }) => active);
  const direct = published.filter(({ content }) => normalizeFaqText(content.question) === query);
  if (direct.length) return direct;
  return published.filter(({ id, content }) => {
    const seed = SEED.find(([seedId]) => seedId === id);
    return seed && normalizeFaqText(seed[2]) === normalizeFaqText(content.question)
      && APPROVED_PHRASES[id]?.some((phrase) => normalizeFaqText(phrase) === query);
  });
}
