import React, { useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import {
  WhatsAppDialog, WhatsAppDispatchDetail, WhatsAppTemplateEditor,
} from '../components/common/WhatsAppDialogs';
import { useAuth } from '../contexts/AuthContext';
import {
  EXPIRY_TYPE, MESSAGE_TYPES, filterDispatches, makeDemoDispatches, readTemplateDrafts,
  readWhatsAppDispatches, saveTemplateDraft,
} from '../services/whatsappCommunications';
import chevron from '../assets/icons/whatsapp-chevron.svg';
import editIcon from '../assets/icons/whatsapp-edit.svg';
import statusIcon from '../assets/icons/whatsapp-status.svg';
import '../themes/whatsappCommunications.css';

const DAYS_FILTERS = [0, 3, 7, 15];
const PAGE_SIZE = 15;
const filterLabel = days => days ? `Próximos ${days} días` : 'Todos';
const initialHistory = { rows: [], warning: '', status: 'loading' };

function DispatchTable({ rows, empty, canRetry, open }) {
  return (
    <div className="whatsapp-table-wrap" role="region" aria-label="Historial de envíos" tabIndex={0}>
      <table className="whatsapp-table">
        <thead>
          <tr>
            <th scope="col">Miembro / destinatario</th>
            <th scope="col">Detalle</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="whatsapp-empty">{empty}</td></tr>}
          {rows.map(row => (
            <tr key={row.id}>
              <td>
                <strong>{row.clientName || 'Destinatario'}</strong>
                <small>{row.recipientMasked || 'Número no disponible'}</small>
              </td>
              <td>{row.detail}</td>
              <td><strong>{row.statusLabel}</strong></td>
              <td>
                <div className="whatsapp-row-actions">
                  <button type="button" aria-label={`Ver detalle de ${row.clientName || 'destinatario'}`}
                    onClick={() => open('detail', row.id)}>Ver detalle</button>
                  {canRetry(row) && (
                    <button type="button" aria-label={`Reintentar envío de ${row.clientName || 'destinatario'}`}
                      onClick={() => open('retry', row.id)}>Reintentar</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CommunicationsPage() {
  const { token, isAdmin } = useAuth();
  const admin = isAdmin();
  const [type, setType] = useState(MESSAGE_TYPES[0]);
  const [history, setHistory] = useState(initialHistory);
  const [refresh, setRefresh] = useState(0);
  const [days, setDays] = useState(0);
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [retryError, setRetryError] = useState('');
  const [accountFeedback, setAccountFeedback] = useState(false);
  const [demo, setDemo] = useState(null);
  const [drafts, setDrafts] = useState(() => {
    try { return readTemplateDrafts(); } catch { return {}; }
  });

  useEffect(() => {
    const request = new AbortController();
    setHistory(initialHistory);
    readWhatsAppDispatches(token, request.signal).then(
      data => { if (!request.signal.aborted) setHistory({ ...data, status: 'ready' }); },
      () => { if (!request.signal.aborted) setHistory({ ...initialHistory, status: 'error' }); }
    );
    return () => request.abort();
  }, [token, refresh]);

  const rows = demo?.rows ?? history.rows;
  const filtered = filterDispatches(rows, type.id, days);
  const lastPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const activePage = Math.min(page, lastPage);
  const visible = filtered.slice(activePage * PAGE_SIZE, (activePage + 1) * PAGE_SIZE);
  const selected = modal?.rowId ? rows.find(row => row.id === modal.rowId) : null;
  const showRetry = row => row?.status === 'FALLIDO' && (admin || Boolean(demo));
  const accountState = demo
    ? (demo.incident ? 'Requiere atención' : 'Conectado')
    : 'Conexión sin verificar';
  const emptyMessage = !demo && history.status === 'loading' ? 'Consultando envíos…'
    : !demo && history.status === 'error' ? 'No se pudo cargar el historial de WhatsApp.'
      : days && type.id === EXPIRY_TYPE ? 'No hay recordatorios para este plazo.'
        : 'Aún no hay envíos registrados para este tipo de mensaje.';

  function open(kind, rowId) {
    setRetryError('');
    setAccountFeedback(false);
    setModal({ kind, rowId });
  }

  function close() {
    setModal(null);
  }

  function selectType(nextType) {
    setType(nextType);
    setPage(0);
    setFeedback('');
  }

  function setMode(nextDemo) {
    setDemo(nextDemo);
    setPage(0);
    setDays(0);
    setFeedback('');
    close();
  }

  function saveDraft(messageType, text) {
    setDrafts(saveTemplateDraft(messageType, text));
    setFeedback('Borrador local guardado. Pendiente de aprobación.');
    close();
  }

  function retryDemo() {
    if (!demo || !showRetry(selected)) return;
    if (demo.incident || !selected.eligible || selected.attemptCount >= 3) {
      setRetryError(demo.incident ? 'La conexión simulada requiere atención.'
        : 'El escenario no cumple las condiciones para reintentar el envío.');
      return;
    }
    setDemo(current => ({
      ...current,
      rows: current.rows.map(row => row.id === selected.id && row.status === 'FALLIDO' ? {
        ...row, status: 'SOLICITADO', statusLabel: 'Pendiente',
        attemptCount: row.attemptCount + 1, errorMessage: '',
      } : row),
    }));
    setFeedback('Reintento simulado registrado como pendiente.');
    close();
  }

  function checkAccount() {
    setAccountFeedback(true);
    if (!demo) setRefresh(value => value + 1);
  }

  return (
    <div className="whatsapp-page">
      <p className="whatsapp-breadcrumb">VIP CENTER FIT / Comunicaciones / WhatsApp y envíos</p>
      <header className="whatsapp-heading whatsapp-page-title">
        <div>
          <h1>WhatsApp y envíos</h1>
          <p className="whatsapp-muted">Consulta las plantillas y el estado de sus envíos.</p>
        </div>
        {admin ? (
          <Button variant="secondary" className="whatsapp-account"
            aria-label={`Cuenta comercial de WhatsApp · ${accountState}`} onClick={() => open('account')}>
            <img src={statusIcon} alt="" />
            {accountState}
            <img src={chevron} alt="" className="whatsapp-chevron" />
          </Button>
        ) : <span className="whatsapp-muted">{accountState}</span>}
      </header>

      <nav className="whatsapp-types" aria-label="Tipos de mensaje">
        {MESSAGE_TYPES.map(item => (
          <Button key={item.id} variant={type.id === item.id ? 'primary' : 'secondary'}
            aria-pressed={type.id === item.id} onClick={() => selectType(item)}>{item.label}</Button>
        ))}
      </nav>

      <section className="whatsapp-template" aria-label="Plantilla de WhatsApp">
        <div className="whatsapp-heading">
          <div>
            <h2>{demo ? 'Plantilla en uso · Aprobada (simulación)' : 'Plantilla de referencia'}</h2>
            <p className="whatsapp-muted">{type.trigger}</p>
          </div>
          {admin && (
            <Button variant="secondary" className="whatsapp-icon" aria-label="Editar plantilla" onClick={() => open('editor')}>
              <img src={editIcon} alt="" />
            </Button>
          )}
        </div>
        <p className="whatsapp-template-text">{type.original}</p>
        {admin && drafts[type.id] && <p className="whatsapp-gold">Borrador local · Pendiente de aprobación</p>}
      </section>

      <section className="whatsapp-history" aria-label="Estado de envíos" aria-busy={!demo && history.status === 'loading'}>
        <div className="whatsapp-heading">
          <h2>Estado de envíos</h2>
          {type.id === EXPIRY_TYPE && (
            <Button variant="secondary" className="whatsapp-filter" onClick={() => open('filter')}>
              Próximo vencimiento · {filterLabel(days)}
              <img src={chevron} alt="" className="whatsapp-chevron" />
            </Button>
          )}
        </div>
        {demo && <p className="whatsapp-gold" role="status">Modo de prueba · Datos de muestra y reintentos simulados.</p>}
        {!demo && history.warning && <p className="whatsapp-muted" role="status">{history.warning}</p>}
        {feedback && <p className="whatsapp-gold" role="status">{feedback}</p>}
        <DispatchTable rows={visible} empty={emptyMessage} canRetry={showRetry} open={open} />
        {lastPage > 0 && (
          <div className="whatsapp-heading whatsapp-pagination">
            <span>Página {activePage + 1} de {lastPage + 1}</span>
            <div className="whatsapp-actions">
              <Button variant="secondary" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>Anterior</Button>
              <Button variant="secondary" disabled={activePage === lastPage} onClick={() => setPage(activePage + 1)}>Siguiente</Button>
            </div>
          </div>
        )}
        <div className="whatsapp-actions whatsapp-tools">
          {demo ? (
            <Button variant="secondary" onClick={() => setMode(null)}>Volver al historial real</Button>
          ) : (
            <Button variant="secondary" disabled={history.status === 'loading'} onClick={() => setRefresh(value => value + 1)}>
              Actualizar historial
            </Button>
          )}
          <Button variant="secondary" onClick={() => open('scenarios')}>Escenarios del prototipo</Button>
        </div>
      </section>

      {modal?.kind === 'editor' && admin && (
        <WhatsAppTemplateEditor type={type} savedText={drafts[type.id]} onSave={saveDraft} onClose={close} />
      )}
      {modal?.kind === 'filter' && (
        <WhatsAppDialog title="Próximos vencimientos" width="540px" onClose={close}>
          <p className="whatsapp-muted">Filtra únicamente los envíos de recordatorios de vencimiento.</p>
          <div className="whatsapp-options">
            {DAYS_FILTERS.map(value => (
              <Button key={value} variant={days === value ? 'primary' : 'secondary'} aria-pressed={days === value}
                onClick={() => { setDays(value); setPage(0); close(); }}>{filterLabel(value)}</Button>
            ))}
          </div>
        </WhatsAppDialog>
      )}
      {modal?.kind === 'detail' && selected && (
        <WhatsAppDispatchDetail row={selected} type={type} canRetry={showRetry(selected)}
          onRetry={() => open('retry', selected.id)} onClose={close} />
      )}
      {modal?.kind === 'retry' && showRetry(selected) && (
        <WhatsAppDialog title="Reintentar envío" width="640px" onClose={close}>
          <p className="whatsapp-muted">{demo
            ? 'Se comprobarán la vigencia del aviso y la autorización del destinatario en el escenario de prueba.'
            : 'El reintento real requiere que el servidor compruebe la vigencia del aviso y el consentimiento actual. Esta comprobación aún no está disponible.'}</p>
          <section className="whatsapp-detail-card">
            <strong>{selected.clientName || 'Destinatario'}</strong>
            <p>{selected.detail}</p>
          </section>
          {retryError && <p className="whatsapp-error" role="alert">{retryError}</p>}
          <div className="whatsapp-actions">
            <Button disabled={!demo} onClick={retryDemo}>Confirmar reintento</Button>
            <Button variant="secondary" onClick={close}>Cancelar</Button>
          </div>
        </WhatsAppDialog>
      )}
      {modal?.kind === 'account' && admin && (
        <WhatsAppDialog title="Cuenta comercial de WhatsApp" width="640px" onClose={close}>
          <p className="whatsapp-muted">WhatsApp Business Platform · Integración oficial</p>
          <section className="whatsapp-detail-card">
            <strong>{accountState}{demo && ' · Simulación'}</strong>
            <p>{demo ? 'Número de muestra · +51 9•• ••• •21' : 'Número comercial sin verificar'}</p>
          </section>
          {accountFeedback && <p role="status" className="whatsapp-muted">{demo
            ? (demo.incident ? 'La conexión simulada requiere atención.' : 'La conexión simulada está disponible.')
            : ({ loading: 'Consultando el servicio de historial…', error: 'El servicio de historial no respondió.',
              ready: history.warning ? 'Se recibió el historial de respaldo. La cuenta sigue sin verificar.'
                : 'El historial está disponible. La API aún no informa el estado de la cuenta en Meta.' })[history.status]}</p>}
          <div className="whatsapp-actions">
            <Button disabled={!demo && history.status === 'loading'} onClick={checkAccount}>Comprobar conexión</Button>
            <Button variant="secondary" onClick={close}>Cerrar</Button>
          </div>
        </WhatsAppDialog>
      )}
      {modal?.kind === 'scenarios' && (
        <WhatsAppDialog title="Escenarios del prototipo" width="820px" onClose={close}>
          <p className="whatsapp-muted">Prueba las cinco vistas con datos de muestra y los permisos de tu sesión.</p>
          <div className="whatsapp-scenarios">
            <section className="whatsapp-detail-card">
              <strong>Roles</strong>
              <p>Administración edita plantillas y comprueba la conexión. Recepción consulta envíos y prueba la atención de fallos.</p>
              <Button onClick={() => setMode({ rows: makeDemoDispatches(), incident: false })}>Probar flujo de envíos</Button>
            </section>
            {admin && (
              <section className="whatsapp-detail-card">
                <strong>Conexión</strong>
                <p>Prueba la comprobación cuando la cuenta comercial requiere atención.</p>
                <Button variant="secondary" onClick={() => {
                  setMode({ rows: makeDemoDispatches(), incident: true });
                  open('account');
                }}>Simular incidencia</Button>
              </section>
            )}
          </div>
          <section className="whatsapp-detail-card">
            <strong>Reglas de envío</strong>
            <p>El aviso debe seguir vigente y el destinatario debe tener un número válido y consentimiento de WhatsApp. La app puede usarse cuando esté habilitada y autorizada.</p>
            <p>Los cambios de plantilla se guardan como borrador pendiente de aprobación. El historial identifica la plantilla y el resultado de cada envío.</p>
          </section>
          <Button variant="secondary" onClick={close}>Cerrar</Button>
        </WhatsAppDialog>
      )}
    </div>
  );
}
