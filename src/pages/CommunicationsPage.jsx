import React, { lazy, Suspense, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReminderHistory from '../components/common/ReminderHistory';
import ChannelStatusPanel from '../components/common/ChannelStatusPanel';
import TrackingTemplates from '../components/common/TrackingTemplates';
import '../themes/commsAndReminders.css';

const prototypeEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_COMMUNICATIONS_PROTOTYPE === 'true';
const PrototypePage = prototypeEnabled ? lazy(() => import('./CommunicationsPrototypePage')) : null;

export default function CommunicationsPage() {
  const { token } = useAuth();
  const [showPrototype, setShowPrototype] = useState(false);
  if (prototypeEnabled && showPrototype) return <>
    <button type="button" className="btn btn-secondary" onClick={() => setShowPrototype(false)}>Volver a Seguimiento</button>
    <Suspense fallback={<p role="status">Cargando entorno de pruebas…</p>}><PrototypePage /></Suspense>
  </>;
  return <div className="comms-page">
    <header className="comms-heading">
      <div><h1>Seguimiento</h1><p>Consulta los resultados de los recordatorios en WhatsApp y la app móvil.</p></div>
    </header>
    <ChannelStatusPanel />
    <TrackingTemplates />
    <ReminderHistory token={token} />
    {prototypeEnabled && <button type="button" className="btn btn-secondary" onClick={() => setShowPrototype(true)}>Abrir entorno de pruebas</button>}
  </div>;
}
