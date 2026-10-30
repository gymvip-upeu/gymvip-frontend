// ==============================================================================
// GYM VIP — Pantalla: VerificationPage (Control Manual de Ingreso en Mostrador)
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { searchClientsApi } from '../api/clientApi';
import { verifyCoverage } from '../api/jorgeApi';
import CoverageCard from '../components/common/CoverageCard';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Icon } from '../components/common/Icons';

export default function VerificationPage({ onNavigate }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState(null);
  const [page, setPage] = useState(0);
  const [searched, setSearched] = useState('');
  const [value, setValue] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);

  useEffect(() => () => {
    sequence.current += 1;
  }, [token]);

  async function search(nextPage = 0, term = query) {
    const request = ++sequence.current;
    setBusy(true);
    setError('');
    setValue(null);
    setSelected(null);
    setClients(null);

    try {
      const result = await searchClientsApi(term, nextPage, 20, token);
      if (request === sequence.current) {
        setClients(result);
        setPage(nextPage);
        setSearched(term);
      }
    } catch (e) {
      if (request === sequence.current) setError(e.message);
    } finally {
      if (request === sequence.current) setBusy(false);
    }
  }

  async function verify(client) {
    const request = ++sequence.current;
    setBusy(true);
    setValue(null);
    setError('');
    setSelected(client);

    try {
      const result = await verifyCoverage(client.id, token);
      if (request === sequence.current) setValue(result);
    } catch (e) {
      if (request === sequence.current) setError(`No se pudo verificar el ingreso del socio. ${e.message}`);
    } finally {
      if (request === sequence.current) setBusy(false);
    }
  }

  const handleClear = () => {
    sequence.current += 1;
    setQuery('');
    setClients(null);
    setSelected(null);
    setValue(null);
    setError('');
    setBusy(false);
  };

  return (
    <section className="verification-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
          Verificación Manual de Ingreso
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Identifique al socio en el mostrador para validar autoritativamente si su membresía le concede acceso hoy.
        </p>
      </div>

      {/* Buscador de Socio */}
      <form
        className="card"
        style={{ padding: '24px', marginBottom: '24px' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) search();
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="form-label" htmlFor="verification-search">
              Buscar Socio por Nombre, DNI o Código (MAR-XXXXXX)
            </label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <Icon name="search" size={16} color="var(--color-text-muted)" />
              </span>
              <input
                id="verification-search"
                className="form-input with-left-icon"
                value={query}
                onChange={(e) => {
                  sequence.current += 1;
                  setBusy(false);
                  setQuery(e.target.value);
                  setValue(null);
                  setSelected(null);
                  setClients(null);
                  setError('');
                }}
                placeholder="Ej. Valeria Mendoza o 74859612"
                required
                autoFocus
              />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={busy || !query.trim()} style={{ minHeight: '44px' }}>
            <Icon name="search" size={16} />
            <span>Consultar Socio</span>
          </Button>

          {(clients || value) && (
            <Button type="button" variant="secondary" onClick={handleClear} disabled={busy} style={{ minHeight: '44px' }}>
              <span>Nueva Consulta</span>
            </Button>
          )}
        </div>
      </form>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {busy && (
        <div style={{ textAlign: 'center', padding: '32px' }} role="status">
          <p style={{ color: 'var(--color-gold)', fontWeight: 600 }}>Consultando al servidor central de validación…</p>
        </div>
      )}

      {/* Resultados de Búsqueda si hay múltiples coincidencias */}
      {clients && !value && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
            Socios Encontrados ({clients.totalElements})
          </h2>

          {!clients.content.length ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                No se encontraron socios registrados con el término "{searched}".
              </p>
              {onNavigate && (
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('clients')}
                  style={{ marginTop: '16px', fontSize: '13px' }}
                >
                  <Icon name="plus" size={14} />
                  <span>Registrar Nuevo Socio</span>
                </Button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {clients.content.map((client) => (
                <div
                  className="card"
                  key={client.id}
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {client.firstName} {client.lastName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {client.documents?.map((d) => `${d.documentType} ${d.documentNumber}`).join(' · ') || 'Sin documento'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-gold)', fontWeight: 600, marginTop: '2px' }}>
                      Código: {client.memberCode}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => verify(client)}
                    style={{ width: '100%', minHeight: '40px' }}
                  >
                    <Icon name="check-circle" size={15} />
                    <span>Verificar Acceso</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {clients.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <Button
                variant="secondary"
                disabled={busy || page === 0}
                onClick={() => search(page - 1, searched)}
              >
                Anterior
              </Button>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Página {page + 1} de {clients.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={busy || clients.last}
                onClick={() => search(page + 1, searched)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Veredicto de Cobertura */}
      {value && (
        <div>
          <CoverageCard
            value={value}
            onGoToRenewal={onNavigate ? () => onNavigate('memberships') : undefined}
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            {selected && (
              <Button variant="secondary" disabled={busy} onClick={() => verify(selected)}>
                <Icon name="refresh" size={15} />
                <span>Volver a Consultar</span>
              </Button>
            )}
            <Button variant="primary" onClick={handleClear}>
              <span>Finalizar y Atender Siguiente Socio</span>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
