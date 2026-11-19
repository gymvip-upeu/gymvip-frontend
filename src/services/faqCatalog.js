import { getFaqCatalogApi, createFaqApi, editFaqApi, transitionFaqApi } from '../api/faqApi.js';

export const FAQ_CATEGORIES = ['Horarios', 'Membresías', 'Renovaciones', 'Servicios', 'Suplementos', 'Pagos', 'Historial', 'Instalaciones', 'Cuenta', 'Catálogo'];
export const FAQ_FILTERS = { category: '', status: '' };

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

export async function readFaqCatalog(token, signal) {
  const records = await getFaqCatalogApi(token, signal);
  if (!Array.isArray(records) || !records.every(validRecord)) {
    throw new Error('El catálogo recibido tiene un formato inválido.');
  }
  return records;
}

export async function saveFaq({ action, record, values, records = [] }, token) {
  if (action === 'create' || action === 'edit') {
    const content = { category: values.category, question: values.question.trim(), answer: values.answer.trim() };
    if (!validContent(content)) throw new Error('Completa la categoría, la pregunta y la respuesta.');
    const duplicate = records.find(item => item.id !== record?.id && [item.content, item.proposal]
      .some(version => version && normalizeFaqText(version.question) === normalizeFaqText(content.question)));
    if (duplicate) {
      const error = new Error('Ya existe una pregunta equivalente.');
      error.duplicate = duplicate;
      throw error;
    }
    return action === 'create' ? createFaqApi(content, token) : editFaqApi(record.id, record.revision, content, token);
  }
  if (!['publish', 'activate', 'deactivate'].includes(action)) throw new Error('Acción inválida.');
  return transitionFaqApi(record.id, record.revision, action, token);
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
