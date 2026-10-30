// ==============================================================================
// GYM VIP — Pantalla: CoveragePage (Vigencias, Alertas y Vencimientos HU-09 / HU-11)
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listCoverage } from '../api/jorgeApi';
import { httpClient } from '../api/httpClient';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icons';
import { stateLabel, dateLabel } from '../components/common/CoverageCard';
import ClientManageModal from '../components/modals/ClientManageModal';

export default function CoveragePage({ onNavigate }) {
  const { token, user } = useAuth();
  const storageKey = `gymvip-coverage-${user?.email || 'default'}`;

  const [saved] = useState(() => {
    const defaults = { query: '', state: 'ALERTAS', planId: '', from: '', to: '' };
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey));
      if (value && Object.keys(defaults).every((key) => typeof value.filters?.[key] === 'string')) {
        return value;
      }
    } catch {}
    return { filters: defaults, page: 0 };
  });

  const [filters, setFilters] = useState(saved.filters);
  const [applied, setApplied] = useState(saved.filters);
  const [page, setPage] = useState(Number.isInteger(saved.page) && saved.page >= 0 ? saved.page : 0);
  const [result, setResult] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ filters: applied, page }));
    } catch {}
  }, [applied, page, storageKey]);

  useEffect(() => {
    let active = true;
    httpClient('/api/v1/plans', {}, token)
      .then(async (r) => {
        if (!r.ok) throw new Error('No se pudieron cargar los planes.');
        return r.json();
      })
      .then((value) => active && setPlans(value))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setResult(null);

    listCoverage({ ...applied, page, size: 20 }, token)
      .then((value) => {
        if (!active) return;
        if (page > 0 && page >= value.totalPages) {
          setPage(Math.max(value.totalPages - 1, 0));
          return;
        }
        setResult(value);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [applied, page, token, revision]);

  useEffect(() => {
    const refresh = () => setRevision((n) => n + 1);
    window.addEventListener('focus', refresh);
    window.addEventListener('gymvip-membership-changed', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('gymvip-membership-changed', refresh);
    };
  }, []);

  const change = (e) => setFilters((previous) => ({ ...previous, [e.target.name]: e.target.value }));

  const getBadgeVariant = (state) => {
    switch (state) {
      case 'VIGENTE': return 'success';
      case 'POR_VENCER': return 'warning';
      case 'VENCIDO': return 'danger';
      case 'CANCELADA': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <section className="coverage-page" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
            Vigencias y Alertas de Vencimiento
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            Supervise la cobertura pagada en tiempo real y priorice a los socios que requieren renovación.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setRevision((n) => n + 1)}>
            <Icon name="refresh" size={15} />
            <span>Actualizar</span>
          </Button>
          {onNavigate && (
            <Button variant="primary" onClick={() => onNavigate('memberships')}>
              <Icon name="credit-card" size={15} />
              <span>Ir a Cobros / Afiliación</span>
            </Button>
          )}
        </div>
      </div>

      {/* Formulario de Filtros */}
      <form
        className="card"
        style={{ padding: '24px', marginBottom: '24px' }}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setApplied({ ...filters });
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" htmlFor="coverage-query">
              Cliente o Documento
            </label>
            <input
              id="coverage-query"
              className="form-input"
              name="query"
              value={filters.query}
              onChange={change}
              placeholder="Nombre, DNI o código..."
            />
          </div>

          <div>
            <label className="form-label" htmlFor="coverage-state">
              Estado de Cobertura
            </label>
            <select
              id="coverage-state"
              className="form-select"
              name="state"
              value={filters.state}
              onChange={change}
            >
              <option value="ALERTAS">⚠️ Alertas (Próximas y Vencidas)</option>
              <option value="TODOS">Todos los Estados</option>
              <option value="VIGENTE">Vigente</option>
              <option value="POR_VENCER">Por Vencer</option>
              <option value="VENCIDO">Vencida</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="PENDIENTE">Inicio Futuro</option>
              <option value="SIN_MEMBRESIA">Sin Membresía</option>
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="coverage-plan">
              Plan Tarifario
            </label>
            <select
              id="coverage-plan"
              className="form-select"
              name="planId"
              value={filters.planId}
              onChange={change}
            >
              <option value="">Todos los planes</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="coverage-from">
              Último Día Válido Desde
            </label>
            <input
              id="coverage-from"
              type="date"
              className="form-input"
              name="from"
              value={filters.from}
              onChange={change}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="coverage-to">
              Hasta
            </label>
            <input
              id="coverage-to"
              type="date"
              className="form-input"
              name="to"
              min={filters.from}
              value={filters.to}
              onChange={change}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const resetFilters = { query: '', state: 'ALERTAS', planId: '', from: '', to: '' };
              setFilters(resetFilters);
              setApplied(resetFilters);
              setPage(0);
            }}
          >
            Limpiar Filtros
          </Button>
          <Button type="submit" variant="primary">
            <Icon name="search" size={15} />
            <span>Aplicar Filtros</span>
          </Button>
        </div>
      </form>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}

      {loading && (
        <div style={{ textAlign: 'center', padding: '36px' }} role="status">
          <p style={{ color: 'var(--color-gold)', fontWeight: 600 }}>Consultando vigencias de socios…</p>
        </div>
      )}

      {!loading && result && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Mostrando <strong>{result.totalElements}</strong> socio(s) · Ordenados por urgencia de fin de membresía.
            </span>
          </div>

          {result.content.length === 0 ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>No se encontraron membresías</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>
                No hay registros que coincidan con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Socio</th>
                      <th>Plan Contratado</th>
                      <th>Inicio</th>
                      <th>Último Día Válido</th>
                      <th>Estado</th>
                      <th>Días Restantes</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.content.map((row) => (
                      <tr key={row.clientId}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {row.fullName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {row.document}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 600 }}>
                            {row.memberCode}
                          </div>
                        </td>
                        <td>
                          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                            {row.planName || '—'}
                          </span>
                        </td>
                        <td>{dateLabel(row.startDate)}</td>
                        <td>
                          <strong style={{ color: row.state === 'VENCIDO' ? 'var(--color-danger)' : (row.state === 'POR_VENCER' ? 'var(--color-warning)' : 'var(--color-gold)') }}>
                            {dateLabel(row.lastIncludedDate)}
                          </strong>
                        </td>
                        <td>
                          <Badge variant={getBadgeVariant(row.state)}>
                            {stateLabel(row.state)}
                          </Badge>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: (row.daysRemaining ?? 0) <= 7 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                            {row.daysRemaining !== null && row.daysRemaining !== undefined ? `${row.daysRemaining} d` : '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <Button
                              variant="secondary"
                              style={{ padding: '4px 10px', minHeight: '32px', fontSize: '12px' }}
                              onClick={() => setSelected({ id: row.clientId })}
                            >
                              <Icon name="edit" size={13} />
                              <span>Ficha / Editar</span>
                            </Button>
                            {onNavigate && (
                              <Button
                                variant="primary"
                                style={{ padding: '4px 10px', minHeight: '32px', fontSize: '12px' }}
                                onClick={() => onNavigate('memberships')}
                              >
                                <span>Renovar</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Paginación */}
          {result.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((n) => n - 1)}
              >
                Anterior
              </Button>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Página {page + 1} de {Math.max(result.totalPages, 1)}
              </span>
              <Button
                variant="secondary"
                disabled={result.last}
                onClick={() => setPage((n) => n + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {selected && (
        <ClientManageModal
          client={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => setRevision((n) => n + 1)}
        />
      )}
    </section>
  );
}
