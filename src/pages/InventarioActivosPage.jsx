// ==============================================================================
// GYM VIP — Pantalla: InventarioActivosPage (Stock Multisede, Kardex y Equipos)
// EMP-06 & EMP-07
// ==============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  listBranchInventoryApi,
  adjustInventoryApi,
  listInventoryMovementsApi,
  listAssetsApi,
  createAssetApi,
  updateAssetStatusApi,
} from '../api/enterpriseOpsApi';
import { formatCurrencyPen } from '../utils/formatters';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { VipTabBar } from '../components/common/VipTabBar';

export default function InventarioActivosPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState('stock');
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adjustForm, setAdjustForm] = useState({ supplementId: '', movementType: 'INGRESO', quantityDelta: 1, reason: '' });
  const [assetForm, setAssetForm] = useState({ assetCode: '', name: '', category: 'MUSCULACIÓN', brand: '', zoneLocation: 'Piso 1', notes: '' });

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const [inv, mov, eq] = await Promise.all([
        listBranchInventoryApi(token),
        listInventoryMovementsApi(token),
        listAssetsApi(token),
      ]);
      setStock(Array.isArray(inv) ? inv : []);
      setMovements(Array.isArray(mov) ? mov : []);
      setAssets(Array.isArray(eq) ? eq : []);
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const delta = adjustForm.movementType === 'SALIDA'
        ? -Math.abs(Number(adjustForm.quantityDelta))
        : Number(adjustForm.quantityDelta);
      await adjustInventoryApi({ ...adjustForm, quantityDelta: delta }, token);
      setNotice('Movimiento registrado en Kardex y stock actualizado.');
      setAdjustForm((f) => ({ ...f, quantityDelta: 1, reason: '' }));
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createAssetApi(assetForm, token);
      setNotice(`Equipo ${assetForm.assetCode.toUpperCase()} registrado.`);
      setAssetForm({ assetCode: '', name: '', category: 'MUSCULACIÓN', brand: '', zoneLocation: 'Piso 1', notes: '' });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '18px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        Control real de existencias por sede con kardex auditable y registro patrimonial de máquinas y equipos.
      </p>

      <VipTabBar
        tabs={[
          { id: 'stock', label: 'Stock por Sede y Kardex', icon: 'package', count: stock.length },
          { id: 'assets', label: 'Activos y Máquinas', icon: 'tool', count: assets.length },
        ]}
        activeTab={tab}
        onChange={setTab}
        ariaLabel="Submódulos de inventario"
      />

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}

      {tab === 'stock' ? (
        <>
          <form className="card" onSubmit={handleAdjust} style={{ padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', alignItems: 'end' }}>
            <div>
              <label className="form-label">Producto</label>
              <select className="form-select" value={adjustForm.supplementId} onChange={(e) => setAdjustForm({ ...adjustForm, supplementId: e.target.value })} required>
                <option value="">Seleccionar producto…</option>
                {stock.map((s) => <option key={s.supplement_id} value={s.supplement_id}>{s.name} ({s.stock_available} u.)</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Tipo</label>
              <select className="form-select" value={adjustForm.movementType} onChange={(e) => setAdjustForm({ ...adjustForm, movementType: e.target.value })}>
                <option value="INGRESO">Ingreso (+)</option>
                <option value="SALIDA">Salida (-)</option>
                <option value="AJUSTE">Ajuste (+)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Cantidad</label>
              <input type="number" min="1" className="form-input" value={adjustForm.quantityDelta} onChange={(e) => setAdjustForm({ ...adjustForm, quantityDelta: Math.max(1, Number(e.target.value) || 1) })} required />
            </div>
            <div>
              <label className="form-label">Motivo *</label>
              <input className="form-input" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="Reposición o merma" required />
            </div>
            <Button type="submit" variant="primary">Aplicar Kardex</Button>
          </form>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Producto</th><th>Marca</th><th>Precio</th><th>Disponible</th><th>Reservado</th><th>Mínimo</th><th>Alerta</th></tr>
              </thead>
              <tbody>
                {stock.map((item) => {
                  const low = Number(item.stock_available) <= Number(item.min_stock_threshold);
                  return (
                    <tr key={item.supplement_id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.brand}</td>
                      <td>{formatCurrencyPen(item.price_pen)}</td>
                      <td style={{ fontWeight: 700, color: low ? 'var(--color-danger)' : 'var(--color-gold)' }}>{item.stock_available}</td>
                      <td>{item.stock_reserved}</td>
                      <td>{item.min_stock_threshold}</td>
                      <td><Badge variant={low ? 'warning' : 'success'}>{low ? 'Stock Bajo' : 'Óptimo'}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Producto</th><th>Movimiento</th><th>Variación</th><th>Saldo Final</th><th>Motivo</th><th>Responsable</th></tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.supplement_name}</td>
                    <td><Badge variant={m.quantity_delta >= 0 ? 'success' : 'warning'}>{m.movement_type}</Badge></td>
                    <td style={{ fontWeight: 700 }}>{m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}</td>
                    <td>{m.stock_after}</td>
                    <td style={{ fontSize: '12px' }}>{m.reason}</td>
                    <td style={{ fontSize: '12px' }}>{m.actor_email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <form className="card" onSubmit={handleCreateAsset} style={{ padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', alignItems: 'end' }}>
            <input className="form-input" placeholder="Código (ej. MAQ-001) *" value={assetForm.assetCode} onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })} required />
            <input className="form-input" placeholder="Nombre equipo *" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} required />
            <input className="form-input" placeholder="Marca" value={assetForm.brand} onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })} />
            <input className="form-input" placeholder="Zona / Piso" value={assetForm.zoneLocation} onChange={(e) => setAssetForm({ ...assetForm, zoneLocation: e.target.value })} />
            <Button type="submit" variant="primary">Registrar Equipo</Button>
          </form>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Código</th><th>Equipo</th><th>Categoría</th><th>Zona</th><th>Estado</th><th>Cambiar Estado</th></tr>
              </thead>
              <tbody>
                {assets.map((eq) => (
                  <tr key={eq.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-gold)' }}>{eq.asset_code}</td>
                    <td><strong>{eq.name}</strong><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{eq.brand || '—'}</div></td>
                    <td>{eq.category}</td>
                    <td>{eq.zone_location || '—'}</td>
                    <td><Badge variant={eq.operational_status === 'OPERATIVO' ? 'success' : 'warning'}>{eq.operational_status}</Badge></td>
                    <td>
                      <select
                        className="form-select"
                        value={eq.operational_status}
                        onChange={async (e) => {
                          try {
                            await updateAssetStatusApi(eq.id, e.target.value, token);
                            await loadAll();
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                      >
                        <option value="OPERATIVO">OPERATIVO</option>
                        <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                        <option value="FUERA_DE_SERVICIO">FUERA_DE_SERVICIO</option>
                        <option value="BAJA">BAJA</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
