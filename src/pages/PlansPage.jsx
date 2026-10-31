import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { formatCurrencyPen } from '../utils/formatters';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import PlanModal from '../components/modals/PlanModal';

export default function PlansPage() {
  const { token, isAdmin } = useAuth();
  const { plans, filterStatus, setFilterStatus, loading, error, successToast, setSuccessToast, updatingStatus, loadPlans, changePlanStatus } = usePlans(token);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState(undefined);
  const [confirm, setConfirm] = useState(null);
  const visible = plans.filter(p => p.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
  const saved = p => { setEditor(undefined); setSuccessToast(`Plan «${p.name}» ${editor ? 'actualizado' : 'creado'} correctamente.`); loadPlans(); };
  return <section className="plans-page" aria-labelledby="plans-title">
    <div className="plans-heading"><div><h1 id="plans-title">Planes</h1><p>{loading ? 'Cargando catálogo…' : `${plans.length} ${plans.length === 1 ? 'plan configurado' : 'planes configurados'}`}</p></div>
      {isAdmin() ? <Button onClick={() => setEditor(null)}>＋ Nuevo plan</Button> : <span className="plan-tag">Solo consulta</span>}
    </div>
    {successToast && <Alert variant="success" message={successToast} onClose={() => setSuccessToast(null)} />}
    {error && <Alert variant="danger" message={error} />}
    <div className="plans-toolbar"><label className="plan-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar plan por nombre" placeholder="Buscar por nombre" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Limpiar búsqueda" onClick={() => setQuery('')}>×</button>}</label>
      <select aria-label="Filtrar planes por estado" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="ALL">Todos los estados</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option></select>
    </div>
    {loading ? <div className="plans-empty" role="status">Cargando planes…</div> : error ? <div className="plans-empty"><p>No pudimos cargar el catálogo.</p><Button variant="secondary" onClick={() => loadPlans()}>Reintentar</Button></div> : visible.length === 0 ? <div className="plans-empty"><span aria-hidden="true">▤</span><h2>{query ? 'No encontramos ese plan' : 'Aún no hay planes en esta vista'}</h2><p>{query ? 'Prueba con otro nombre o cambia el filtro.' : 'Crea un plan para empezar a gestionar tus membresías.'}</p></div> : <div className="plans-grid">{visible.map(p => <article className={`plan-card ${p.status !== 'ACTIVO' ? 'is-inactive' : ''}`} key={p.id}>
      <div className="plan-card-top"><div className="plan-tags"><span className="plan-tag">{p.durationDays === 30 ? 'Mensual' : p.durationDays === 90 ? 'Trimestral' : p.durationDays === 180 ? 'Semestral' : p.durationDays === 365 ? 'Anual' : 'Personalizado'}</span><span className={`plan-state ${p.status === 'ACTIVO' ? '' : 'inactive'}`}><i />{p.status === 'ACTIVO' ? 'Activo' : 'Inactivo'}</span></div>
        {isAdmin() && <details className="plan-menu"><summary aria-label={`Acciones de ${p.name}`}>···</summary><div><button onClick={e => { e.currentTarget.closest('details').open = false; setEditor(p); }}>Editar plan</button><button onClick={e => { e.currentTarget.closest('details').open = false; setConfirm(p); }}>{p.status === 'ACTIVO' ? 'Desactivar plan' : 'Activar plan'}</button></div></details>}
      </div><h2>{p.name}</h2>{p.description && <p className="plan-description">{p.description}</p>}
      <div className="plan-price">{formatCurrencyPen(p.pricePen)}<span>/ {p.durationDays ? `${p.durationDays} días` : 'sin vencimiento'}</span></div>
      <p className="plan-benefits">{p.benefits || 'Sin beneficios adicionales'}</p>{p.conditions && <p className="plan-conditions"><strong>Condiciones</strong>{p.conditions}</p>}
    </article>)}</div>}
    {editor !== undefined && <PlanModal plan={editor} token={token} onClose={() => setEditor(undefined)} onSuccess={saved} />}
    {confirm && <Modal titleId="plan-status-title" onClose={() => !updatingStatus && setConfirm(null)}><h2 id="plan-status-title">{confirm.status === 'ACTIVO' ? 'Desactivar' : 'Activar'} plan</h2><p>¿Deseas {confirm.status === 'ACTIVO' ? 'desactivar' : 'activar'} «{confirm.name}»?</p><p className="plan-help">Las membresías contratadas conservarán sus condiciones originales.</p><div className="plan-form-actions"><Button variant="secondary" disabled={updatingStatus} onClick={() => setConfirm(null)}>Cancelar</Button><Button disabled={updatingStatus} onClick={async () => { await changePlanStatus(confirm); setConfirm(null); }}>{updatingStatus ? 'Guardando…' : 'Confirmar'}</Button></div></Modal>}
  </section>;
}
