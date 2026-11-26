// ==============================================================================
// GYM VIP — Pantalla: ComprasProveedoresPage (Proveedores y Compras EMP-08)
// ==============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  listSuppliersApi,
  createSupplierApi,
  listPurchaseOrdersApi,
  createPurchaseOrderApi,
  receivePurchaseOrderApi,
  listBranchInventoryApi,
} from '../api/enterpriseOpsApi';
import { formatCurrencyPen } from '../utils/formatters';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export default function ComprasProveedoresPage() {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [supForm, setSupForm] = useState({ ruc: '', businessName: '', category: 'SUPLEMENTOS', contactName: '', phone: '', email: '' });
  const [poForm, setPoForm] = useState({ supplierId: '', supplementId: '', quantity: 10, unitCostPen: 80, notes: '' });

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const [s, po, inv] = await Promise.all([
        listSuppliersApi(token),
        listPurchaseOrdersApi(token),
        listBranchInventoryApi(token).catch(() => []),
      ]);
      setSuppliers(Array.isArray(s) ? s : []);
      setOrders(Array.isArray(po) ? po : []);
      setProducts(Array.isArray(inv) ? inv : []);
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createSupplierApi(supForm, token);
      setNotice(`Proveedor ${supForm.businessName} registrado.`);
      setSupForm({ ruc: '', businessName: '', category: 'SUPLEMENTOS', contactName: '', phone: '', email: '' });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const selectedProd = products.find((p) => String(p.supplement_id) === String(poForm.supplementId));
      await createPurchaseOrderApi({
        supplierId: poForm.supplierId,
        notes: poForm.notes,
        items: [{
          supplementId: poForm.supplementId || null,
          description: selectedProd?.name || 'Reposición general',
          quantity: Math.max(1, Number(poForm.quantity)),
          unitCostPen: Math.max(0.01, Number(poForm.unitCostPen)),
        }],
      }, token);
      setNotice('Orden de compra emitida en estado APROBADA.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '18px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        Gestión de proveedores homologados (RUC 11 dígitos), órdenes de compra y recepción automática al stock de sede.
      </p>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        <form className="card" onSubmit={handleCreateSupplier} style={{ padding: '18px', display: 'grid', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: 'var(--color-gold)' }}>Nuevo Proveedor</h2>
          <input className="form-input" inputMode="numeric" placeholder="RUC (11 dígitos) *" value={supForm.ruc} onChange={(e) => setSupForm({ ...supForm, ruc: e.target.value.replace(/\D/g, '').slice(0, 11) })} required />
          <input className="form-input" placeholder="Razón social *" value={supForm.businessName} onChange={(e) => setSupForm({ ...supForm, businessName: e.target.value })} required />
          <input className="form-input" placeholder="Contacto comercial" value={supForm.contactName} onChange={(e) => setSupForm({ ...supForm, contactName: e.target.value })} />
          <Button type="submit" variant="primary">Registrar Proveedor</Button>
        </form>

        <form className="card" onSubmit={handleCreatePo} style={{ padding: '18px', display: 'grid', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: 'var(--color-gold)' }}>Emitir Orden de Compra</h2>
          <select className="form-select" value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })} required>
            <option value="">Seleccionar proveedor…</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.business_name} ({s.ruc})</option>)}
          </select>
          <select className="form-select" value={poForm.supplementId} onChange={(e) => setPoForm({ ...poForm, supplementId: e.target.value })}>
            <option value="">Insumo / Suplemento general…</option>
            {products.map((p) => <option key={p.supplement_id} value={p.supplement_id}>{p.name}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input type="number" min="1" className="form-input" placeholder="Cantidad" value={poForm.quantity} onChange={(e) => setPoForm({ ...poForm, quantity: Math.max(1, Number(e.target.value) || 1) })} required />
            <input type="number" min="0.01" step="0.01" className="form-input" placeholder="Costo unit. S/" value={poForm.unitCostPen} onChange={(e) => setPoForm({ ...poForm, unitCostPen: Math.max(0.01, Number(e.target.value) || 0.01) })} required />
          </div>
          <Button type="submit" variant="primary">Emitir Orden</Button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Nro. Orden</th><th>Proveedor</th><th>Total</th><th>Estado</th><th>Creada por</th><th style={{ textAlign: 'right' }}>Acción</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin órdenes registradas.</td></tr>
            ) : orders.map((po) => (
              <tr key={po.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-gold)' }}>{po.order_number}</td>
                <td>{po.supplier_name}</td>
                <td>{formatCurrencyPen(po.total_pen)}</td>
                <td><Badge variant={po.status === 'RECIBIDA' ? 'success' : 'gold'}>{po.status}</Badge></td>
                <td style={{ fontSize: '12px' }}>{po.created_by}</td>
                <td style={{ textAlign: 'right' }}>
                  {po.status !== 'RECIBIDA' && po.status !== 'ANULADA' && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await receivePurchaseOrderApi(po.id, token);
                        setNotice(`Orden ${po.order_number} recibida e ingresada al inventario.`);
                        await loadAll();
                      }}
                    >
                      Confirmar Recepción
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
