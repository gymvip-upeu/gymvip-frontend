import React, { useEffect, useRef, useState } from 'react';
import { getReminderConfigApi, updateReminderConfigApi } from '../api/reminderApi';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/feedback/LoadingState';
import { useAuth } from '../contexts/AuthContext';
import switchOff from '../assets/icons/reminder-switch-off.svg';
import switchOn from '../assets/icons/reminder-switch-on.svg';
import '../themes/reminderConfig.css';

const ANTICIPATION_DAYS = [15, 7, 5, 3];
const CHANNELS = [
  { id: 'APP', label: 'Aplicación móvil', description: 'Disponible para miembros que autorizaron los avisos.' },
  { id: 'WHATSAPP', label: 'WhatsApp', description: 'Requiere un contacto válido y autorización.' },
];

const PREVIEWS = {
  upcoming: {
    label: 'Vence pronto',
    title: 'Tu membresía vence en 3 días',
    message: 'Hola, Ana Torres. Tu plan Mensual de VIP Center Fit vence el 15 de noviembre de 2026. Faltan 3 días. Puedes renovar tu membresía en recepción.',
    note: 'La vista previa usa una fecha de ejemplo. Los avisos respetarán los días seleccionados.',
  },
  expired: {
    label: 'Ya venció',
    title: 'Tu membresía venció hace 1 día',
    message: 'Hola, Ana Torres. Tu plan Mensual de VIP Center Fit venció el 15 de noviembre de 2026. Venció hace 1 día. Puedes renovar tu membresía en recepción.',
    note: 'La regla aprobada prevé avisar los días 1 y 5 mientras la membresía siga vencida.',
  },
};

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function ReminderNotice({ title, children, tone = 'info' }) {
  return (
    <div className={`reminder-notice reminder-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}

function ReminderSwitch({ label, description, checked, onChange, disabled }) {
  return (
    <div className="reminder-switch-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      {onChange ? (
        <button
          type="button"
          className="reminder-switch"
          role="switch"
          aria-label={label}
          aria-checked={checked}
          onClick={onChange}
          disabled={disabled}
        >
          <img src={checked ? switchOn : switchOff} alt="" />
        </button>
      ) : (
        <img src={checked ? switchOn : switchOff} alt={checked ? 'Activado' : 'Desactivado'} />
      )}
    </div>
  );
}

function ReminderSettings({ config, onChange, disabled }) {
  const editable = Boolean(onChange);

  return (
    <div className="reminder-grid">
      <section className="reminder-panel" aria-label="Programación">
        <h2>Programación</h2>
        <p>Horarios según la fecha local de Lima (UTC−5).</p>
        <strong>Antes del vencimiento</strong>
        <div className="reminder-days" role="group" aria-label="Días de anticipación">
          {ANTICIPATION_DAYS.map((day) => {
            const selected = config.anticipationDays.includes(day);
            const label = <>{selected && <span aria-hidden="true">✓ </span>}{day} días</>;
            return editable ? (
              <button
                key={day}
                type="button"
                className="reminder-day"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onChange('anticipationDays', toggleValue(config.anticipationDays, day))}
              >{label}</button>
            ) : (
              <span key={day} className="reminder-day" data-selected={selected}>
                {label}<span className="reminder-sr-only">{selected ? ', seleccionado' : ', sin seleccionar'}</span>
              </span>
            );
          })}
        </div>
        <p>{editable ? 'Puedes combinar días. La regla prevé un aviso por fecha y canal.' : 'Los días en dorado corresponden a la programación guardada.'}</p>
        <strong>Después del vencimiento</strong>
        <p>Días 1 y 5 previstos, si la membresía sigue vencida.</p>
        <strong className="reminder-gold">Horario previsto · 10:00 a. m. (hora de Lima)</strong>
        <p className="reminder-runtime-note">
          El backend actual evalúa los días 1 a {config.postExpiryDays} mediante un corte manual.
        </p>
      </section>

      <section className="reminder-panel" aria-label="Canales">
        <h2>Canales</h2>
        <p>Cada miembro puede recibir avisos por los canales que haya autorizado.</p>
        {CHANNELS.map((channel) => (
          <ReminderSwitch
            key={channel.id}
            label={channel.label}
            description={channel.description}
            checked={config.channels.includes(channel.id)}
            onChange={editable ? () => onChange('channels', toggleValue(config.channels, channel.id)) : undefined}
            disabled={disabled}
          />
        ))}
        <p>Si falta un contacto válido de WhatsApp, la regla prevé usar la app cuando esté habilitada y autorizada.</p>
        <p className="reminder-runtime-note">La configuración guarda ambos canales. El evaluador actual despacha por WhatsApp.</p>
      </section>
    </div>
  );
}

function ReminderPreview({ mode, onChange, onBack }) {
  const preview = PREVIEWS[mode];
  return (
    <>
      <div className="reminder-actions" role="group" aria-label="Tipo de aviso">
        {Object.entries(PREVIEWS).map(([key, option]) => (
          <Button key={key} variant={key === mode ? 'primary' : 'secondary'} aria-pressed={key === mode} onClick={() => onChange(key)}>
            {option.label}
          </Button>
        ))}
      </div>
      <div className="reminder-grid">
        <section className="reminder-panel">
          <h2>Aplicación móvil</h2>
          <ReminderNotice title={preview.title}>{preview.message}</ReminderNotice>
        </section>
        <section className="reminder-panel">
          <h2>WhatsApp</h2>
          <ReminderNotice title="VIP Center Fit">{preview.message}</ReminderNotice>
        </section>
      </div>
      <p className="reminder-description">{preview.note}</p>
      <div className="reminder-actions"><Button onClick={onBack}>Volver a edición</Button></div>
    </>
  );
}

export default function ReminderConfigPage() {
  const { token } = useAuth();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [view, setView] = useState('summary');
  const [preview, setPreview] = useState('upcoming');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [validation, setValidation] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const heading = useRef(null);

  useEffect(() => {
    if (!token) return undefined;
    let current = true;
    getReminderConfigApi(token)
      .then((config) => { if (current) setSaved(config); })
      .catch((error) => { if (current) setLoadError(error.message); });
    return () => { current = false; };
  }, [token, loadAttempt]);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [view]);

  function navigate(next) {
    setView(next);
  }

  function edit() {
    setDraft(saved);
    setConfirmed(false);
    setValidation('');
    navigate('edit');
  }

  function change(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setValidation('');
  }

  async function persist() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const result = await updateReminderConfigApi({
        enabled: draft.enabled,
        anticipationDays: [...draft.anticipationDays].sort((a, b) => a - b),
        postExpiryDays: draft.postExpiryDays,
        channels: draft.channels,
      }, token);
      setSaved(result);
      setDraft(null);
      setConfirmed(true);
      navigate('summary');
    } catch (error) {
      setSaveError(error.message || 'Revisa la conexión y vuelve a intentarlo.');
      navigate('save-error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (draft.enabled && !CHANNELS.some(({ id }) => draft.channels.includes(id))) {
      setValidation('Para guardar la automatización activa, habilita Aplicación móvil o WhatsApp.');
      return;
    }
    if (saved.enabled && !draft.enabled) {
      navigate('pause');
      return;
    }
    persist();
  }

  const copy = {
    summary: ['Recordatorios automáticos', 'Consulta la programación y los canales guardados para los avisos de membresía.'],
    edit: ['Editar recordatorios', 'Configura el envío automático de avisos de vencimiento de membresía.'],
    preview: [`Vista previa · ${PREVIEWS[preview].label}`, 'Ejemplo de contenido para una membresía de VIP Center Fit.'],
    pause: ['Pausar recordatorios', 'Confirma antes de aplicar el cambio de estado.'],
    discard: ['Descartar cambios', 'Confirma antes de salir de la edición.'],
    'save-error': ['No se pudieron guardar los cambios', 'La última configuración guardada continúa vigente.'],
  };

  return (
    <div className="reminder-config">
      <p className="reminder-breadcrumb">VIP CENTER FIT <span>/</span> Comunicaciones <span>/</span> Recordatorios</p>
      <header className="reminder-title">
        <h1 ref={heading} tabIndex={-1}>{copy[view][0]}</h1>
        <p>{copy[view][1]}</p>
      </header>

      {loadError ? (
        <>
          <ReminderNotice title="No se pudo cargar la configuración" tone="error">{loadError}</ReminderNotice>
          <div className="reminder-actions">
            <Button onClick={() => { setLoadError(''); setLoadAttempt((attempt) => attempt + 1); }}>Volver a consultar</Button>
          </div>
        </>
      ) : !saved ? (
        <LoadingState message="Cargando la configuración de recordatorios…" />
      ) : view === 'summary' ? (
        <>
          {confirmed && saved.enabled && (
            <ReminderNotice title="Configuración guardada" tone="success">Los cambios se guardaron para la próxima evaluación.</ReminderNotice>
          )}
          {saved.enabled ? (
            <ReminderNotice title="Automatización habilitada">Los periodos ya renovados se omiten al evaluar los avisos.</ReminderNotice>
          ) : (
            <ReminderNotice title="Recordatorios pausados" tone={confirmed ? 'success' : 'info'}>
              Los próximos cortes quedan pausados. Los días y canales guardados se conservan para reactivar los avisos.
            </ReminderNotice>
          )}
          <ReminderSettings config={saved} />
          <div className="reminder-actions"><Button onClick={edit}>Editar configuración</Button></div>
        </>
      ) : view === 'edit' ? (
        <form className="reminder-form" onSubmit={submit}>
          {validation && <ReminderNotice title="Selecciona al menos un canal" tone="error">{validation}</ReminderNotice>}
          <section className="reminder-panel">
            <h2>Estado de la automatización</h2>
            <ReminderSwitch
              label="Recordatorios automáticos"
              description="Desactiva el interruptor y guarda para pausar los próximos envíos."
              checked={draft.enabled}
              onChange={() => change('enabled', !draft.enabled)}
              disabled={saving}
            />
          </section>
          <ReminderSettings config={draft} onChange={change} disabled={saving} />
          <div className="reminder-actions">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
            <Button variant="secondary" disabled={saving} onClick={() => { setPreview('upcoming'); navigate('preview'); }}>Vista previa</Button>
            <Button variant="secondary" disabled={saving} onClick={() => navigate('discard')}>Cancelar</Button>
          </div>
        </form>
      ) : view === 'preview' ? (
        <ReminderPreview mode={preview} onChange={setPreview} onBack={() => navigate('edit')} />
      ) : view === 'save-error' ? (
        <>
          <ReminderNotice title="Error de guardado" tone="error">Tus cambios se conservan. {saveError}</ReminderNotice>
          <ReminderSettings config={draft} />
          <div className="reminder-actions">
            <Button disabled={saving} onClick={persist}>{saving ? 'Guardando…' : 'Reintentar guardado'}</Button>
            <Button variant="secondary" disabled={saving} onClick={() => navigate('edit')}>Volver a edición</Button>
            <Button variant="secondary" disabled={saving} onClick={() => navigate('discard')}>Cancelar</Button>
          </div>
        </>
      ) : (
        <>
          <section className="reminder-panel reminder-confirmation">
            <h2>{view === 'pause' ? '¿Pausar los avisos automáticos?' : '¿Descartar los cambios?'}</h2>
            <p>{view === 'pause'
              ? 'Los próximos cortes quedarán pausados. La programación y los canales que guardes quedarán disponibles para la reactivación.'
              : 'Se restaurará la última configuración guardada.'}</p>
          </section>
          <div className="reminder-actions">
            {view === 'pause' ? (
              <Button disabled={saving} onClick={persist}>{saving ? 'Guardando…' : 'Confirmar pausa'}</Button>
            ) : (
              <Button onClick={() => { setDraft(null); setValidation(''); navigate('summary'); }}>Descartar cambios</Button>
            )}
            <Button variant="secondary" disabled={saving} onClick={() => navigate('edit')}>
              {view === 'pause' ? 'Volver a edición' : 'Seguir editando'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
