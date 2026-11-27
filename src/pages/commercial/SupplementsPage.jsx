import React, { useEffect, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { getBranchesApi } from '../../api/staffApi';
import StockEntriesPanel from './StockEntriesPanel';
import { hasPermission } from '../../services/permissionsService';
import { useAuth } from '../../contexts/AuthContext';
import { listSupplements, listCatalogProducts, getSupplement } from '../../api/catalogApi';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import CatalogImage from '../../components/catalog/CatalogImage';
import SupplementEditor from '../../components/catalog/SupplementEditor';
import SupplementStateDialog from '../../components/catalog/SupplementStateDialog';
import CatalogHistory from '../../components/catalog/CatalogHistory';
import { categories, categoryLabel, availabilityLabel, presentationLabel, updatedLabel } from '../../components/catalog/catalogUtils';
import { formatCurrencyPen } from '../../utils/formatters';

export default function SupplementsPage() {
  const { token, user, isBusinessExecutive } = useAuth();
  const isAdmin = isBusinessExecutive;
  const canSeeCatalog = isAdmin() || user?.roles?.includes('RECEPCION');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [draft, setDraft] = useState({ query: '', category: '', availability: '', published: '' });
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards' (COR-08)
  const [result, setResult] = useState(null);
  const [storeProducts, setStoreProducts] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [view, setView] = useState({ kind: 'list' });
  const [detail, setDetail] = useState(null);
  const [stateItem, setStateItem] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    if (!canSeeCatalog) return;
    let active = true;
    getBranchesApi(token).then((result) => {
      if (!active) return;
      const options = result.filter((branch) => branch.status === 'ACTIVO');
      setBranches(options);
      setBranchId(options[0]?.id ?? '');
    }).catch(() => { if (active) setError('No se pudieron cargar las sedes.'); });
    return () => { active = false; };
  }, [token, canSeeCatalog]);

  useEffect(() => {
    if (view.kind !== 'list' || !canSeeCatalog) return;
    let active = true;
    setLoading(true);
    setError('');
    setResult(null);
    Promise.all([listSupplements({ ...filters, branchId, page, size: 12 }, token), listCatalogProducts(token, 60, branchId)])
      .then(([value, products]) => {
        if (!active) return;
        setResult(value);
        setStoreProducts(new Map((Array.isArray(products) ? products : []).map((item) => [item.id, item])));
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, filters, page, reload, view.kind, branchId, canSeeCatalog]);

  useEffect(() => {
    if (!view.id) return;
    let active = true;
    setLoading(true);
    setError('');
    setDetail(null);
    setSelectedPhoto(0);
    getSupplement(view.id, token)
      .then((value) => active && setDetail(value))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [view.id, view.kind, token, reload]);

  const back = () => {
    setView({ kind: 'list' });
    setDetail(null);
    setError('');
  };
  const saved = (item) => {
    setNotice(`«${item.name}» ${view.kind === 'new' ? 'registrado' : 'actualizado'} correctamente.`);
    setView({ kind: 'detail', id: item.id });
    setDetail(item);
    setReload((n) => n + 1);
  };
  const open = (kind, item) => {
    setView({ kind, id: item.id });
    setNotice('');
  };

  if (view.kind === 'new' || (view.kind === 'edit' && detail && !loading)) {
    return <SupplementEditor key={view.id || 'new'} item={view.kind === 'edit' ? detail : null} onClose={back} onSaved={saved} branchId={branchId} branchName={branches.find((branch) => branch.id === branchId)?.name} />;
  }

  if (hasPermission(user, 'supplements.stock.read') && !canSeeCatalog) {
    return <StockEntriesPanel token={token} user={user} />;
  }

  return (
    <section className="catalog-page">
      {hasPermission(user, 'supplements.stock.read') && <StockEntriesPanel token={token} user={user} selectedId={detail?.id} initialBranchId={branchId} onStockChanged={() => setReload((value) => value + 1)} />}
      {view.kind === 'list' && branches.length > 0 && (
        <TextField select size="small" label="Sede del catálogo" value={branchId}
          onChange={(event) => { setBranchId(event.target.value); setPage(0); }}>
          {branches.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
      )}
      {view.kind === 'detail'  || view.kind === 'edit' ? (
        <>
          <button className="catalog-back" onClick={back}>← Volver al catálogo</button>
          {error && <Alert variant="danger" message={error} />}
          {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}
          {loading ? (
            <div className="catalog-empty" role="status">Cargando suplemento…</div>
          ) : !detail ? (
            <Button variant="secondary" onClick={() => setReload((n) => n + 1)}>Reintentar</Button>
          ) : (
            <>
              <div className="catalog-page-heading">
                <div>
                  <div className="catalog-eyebrow">CATÁLOGO / {categoryLabel(detail.category)}</div>
                  <h1>{detail.name}</h1>
                  <p>Información del producto y acciones de administración.</p>
                </div>
              </div>
              <article className="catalog-panel catalog-product-detail">
                <div className="catalog-detail-gallery">
                  <CatalogImage item={detail} photo={detail.images[selectedPhoto]} large />
                  <div className="catalog-gallery-thumbs">
                    {detail.images.map((photo, index) => (
                      <button
                        key={photo.id}
                        className={index === selectedPhoto ? 'active' : ''}
                        onClick={() => setSelectedPhoto(index)}
                        aria-label={`Ver imagen ${index + 1}: ${photo.filename}`}
                        aria-pressed={index === selectedPhoto}
                      >
                        <CatalogImage item={detail} photo={photo} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="catalog-detail-copy">
                  <span className="catalog-eyebrow">{detail.brand}</span>
                  <h2>{detail.name}</h2>
                  <p className="catalog-muted">{presentationLabel(detail)}</p>
                  <strong className="catalog-price">{formatCurrencyPen(detail.pricePen)}</strong>
                  <div className="catalog-detail-status">
                    <span className={`catalog-status ${detail.availability === 'AGOTADO' ? 'is-unavailable' : ''}`}>
                      {availabilityLabel(detail.availability)}
                    </span>
                    {!detail.published && <span className="catalog-hidden-tag">Oculto del catálogo</span>}
                  </div>
                  <p className="catalog-detail-description">{detail.description}</p>
                  {detail.ingredients && (
                    <div className="catalog-detail-ingredients">
                      <h3>Ingredientes y alérgenos</h3>
                      <p>{detail.ingredients}</p>
                    </div>
                  )}
                  <p className="catalog-help">Última actualización: {updatedLabel(detail.updatedAtUtc)}</p>
                  {isAdmin() && (
                    <div className="catalog-detail-actions">
                      <Button onClick={() => open('edit', detail)}>Editar información</Button>
                      <Button variant="secondary" onClick={() => setStateItem(detail)}>Cambiar disponibilidad</Button>
                    </div>
                  )}
                </div>
              </article>
              {isAdmin() && <CatalogHistory key={`${detail.id}-${detail.version}`} item={detail} />}
            </>
          )}
        </>
      ) : (
        <>
          <div className="catalog-page-heading" style={{ alignItems: 'center' }}>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Administra productos, presentación, precios en Soles (PEN), visibilidad y stock operativo por sede.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', gap: '6px' }} role="group" aria-label="Vista de suplementos">
                <Button type="button" variant={viewMode === 'table' ? 'primary' : 'secondary'} onClick={() => setViewMode('table')}>Tabla</Button>
                <Button type="button" variant={viewMode === 'cards' ? 'primary' : 'secondary'} onClick={() => setViewMode('cards')}>Tarjetas</Button>
              </div>
              {isAdmin() && <Button onClick={() => setView({ kind: 'new' })}>＋ Nuevo suplemento</Button>}
            </div>
          </div>
          {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}
          <form
            className="catalog-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(0);
              setFilters({ ...draft });
            }}
          >
            <label className="catalog-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="10" cy="10" r="6" />
                <path d="m15 15 5 5" />
              </svg>
              <input
                aria-label="Buscar suplemento por nombre o marca"
                placeholder="Buscar por nombre o marca"
                value={draft.query}
                onChange={(e) => setDraft((v) => ({ ...v, query: e.target.value }))}
              />
            </label>
            <select
              aria-label="Filtrar por categoría"
              value={draft.category}
              onChange={(e) => {
                const value = { ...draft, category: e.target.value };
                setDraft(value);
                setFilters(value);
                setPage(0);
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar por disponibilidad"
              value={draft.availability}
              onChange={(e) => {
                const value = { ...draft, availability: e.target.value };
                setDraft(value);
                setFilters(value);
                setPage(0);
              }}
            >
              <option value="">Toda disponibilidad</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="AGOTADO">Agotado</option>
            </select>
            <select
              aria-label="Filtrar por publicación"
              value={draft.published}
              onChange={(e) => {
                const value = { ...draft, published: e.target.value };
                setDraft(value);
                setFilters(value);
                setPage(0);
              }}
            >
              <option value="">Toda publicación</option>
              <option value="true">Visibles</option>
              <option value="false">Ocultos</option>
            </select>
            <Button type="submit" variant="secondary">Buscar</Button>
          </form>

          {error ? (
            <div className="catalog-empty">
              <Alert variant="danger" message={error} />
              <Button variant="secondary" onClick={() => setReload((n) => n + 1)}>Reintentar</Button>
            </div>
          ) : loading ? (
            <div className="catalog-empty" role="status">Cargando catálogo de suplementos…</div>
          ) : !result?.content?.length ? (
            <div className="catalog-empty">
              <span className="catalog-empty-icon" aria-hidden="true">▤</span>
              <h2>No hay suplementos para mostrar</h2>
              <p>{Object.values(filters).some(Boolean) ? 'Cambia los filtros o busca otro nombre.' : 'Registra el primer suplemento para comenzar tu catálogo.'}</p>
              {Object.values(filters).some(Boolean) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const clear = { query: '', category: '', availability: '', published: '' };
                    setDraft(clear);
                    setFilters(clear);
                    setPage(0);
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Código / SKU</th>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Sede</th>
                    <th>Publicación</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {result.content.map((item) => {
                    const store = storeProducts.get(item.id);
                    const offer = store?.offer;
                    const currentPrice = offer?.pricePen ?? item.pricePen;
                    const sku = item.barcode || item.sku || `SUP-${String(item.id || '').slice(0, 6).toUpperCase()}`;
                    const stockVal = store?.availableStock ?? item.stockAvailable ?? '—';
                    return (
                      <tr key={item.id}>
                        <td style={{ width: '64px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden' }}>
                            <CatalogImage item={item} />
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-gold)' }}>{sku}</td>
                        <td>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{presentationLabel(item)}</div>
                        </td>
                        <td>{item.brand}</td>
                        <td>{categoryLabel(item.category)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrencyPen(currentPrice)}</td>
                        <td>{stockVal}</td>
                        <td style={{ fontSize: '12px' }}>{item.branchName || 'Sede Central'}</td>
                        <td>
                          <Badge variant={item.published ? 'success' : 'neutral'}>
                            {item.published ? 'Visible' : 'Oculto'}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={item.availability === 'DISPONIBLE' ? 'gold' : 'danger'}>
                            {availabilityLabel(item.availability)}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <Button variant="secondary" onClick={() => open('detail', item)}>Ver</Button>
                            {isAdmin() && <Button variant="secondary" onClick={() => open('edit', item)}>Editar</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="catalog-grid">
              {result.content.map((item) => {
                const store = storeProducts.get(item.id);
                const offer = store?.offer;
                const currentPrice = offer?.pricePen ?? item.pricePen;
                return (
                  <article className="catalog-panel catalog-product-card catalog-store-card" key={item.id}>
                    <div className="catalog-store-image">
                      <CatalogImage item={item} />
                      {offer && (
                        <span className="catalog-discount-badge">
                          -{store.promotionDiscountPercent ?? Math.max(0, Math.round((1 - Number(currentPrice) / Number(item.pricePen)) * 100))}%
                        </span>
                      )}
                      <div className="catalog-store-status">
                        <span className={`catalog-status ${item.availability === 'AGOTADO' ? 'is-unavailable' : ''}`}>
                          {availabilityLabel(item.availability)}
                        </span>
                        {!item.published && <span className="catalog-hidden-tag">Oculto</span>}
                      </div>
                    </div>
                    <span className="catalog-card-category">{categoryLabel(item.category)}</span>
                    <h2>{item.name}</h2>
                    <p className="catalog-muted">{item.brand}</p>
                    <p className="catalog-presentation">{presentationLabel(item)}</p>
                    {offer && <p className="catalog-offer-name">{offer.name}</p>}
                    <div className="catalog-store-prices">
                      {offer && <span>{formatCurrencyPen(item.pricePen)}</span>}
                      <strong className="catalog-price">{formatCurrencyPen(currentPrice)}</strong>
                    </div>
                    <div className="catalog-card-actions">
                      <Button variant="secondary" onClick={() => open('detail', item)}>Ver suplemento</Button>
                      {isAdmin() && <Button variant="secondary" onClick={() => open('edit', item)}>Editar</Button>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {result && result.totalElements > 0 && (
            <div className="catalog-pagination">
              <span>{result.totalElements} suplementos · Página {page + 1} de {Math.max(result.totalPages, 1)}</span>
              <div>
                <Button variant="secondary" disabled={page === 0 || loading} onClick={() => setPage((n) => n - 1)}>Anterior</Button>
                <Button variant="secondary" disabled={page + 1 >= result.totalPages || loading} onClick={() => setPage((n) => n + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </>
      )}
      {stateItem && (
        <SupplementStateDialog
          item={stateItem}
          onClose={() => setStateItem(null)}
          onSaved={(item) => {
            setStateItem(null);
            setNotice(`Disponibilidad de «${item.name}» actualizada.`);
            setReload((n) => n + 1);
          }}
        />
      )}
      <footer className="catalog-footer">GYM VIP · Catálogo y promociones</footer>
    </section>
  );
}
