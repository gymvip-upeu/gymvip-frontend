// ==============================================================================
// GYM VIP — Pantalla: CajasFinanzasPage (Cajas y Movimientos Financieros EMP-09)
// ==============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  listCashRegistersApi,
  openCashRegisterApi,
  recordCashMovementApi,
  closeCashRegisterApi,
} from '../../api/enterpriseOpsApi';
import { formatCurrencyPen } from '../../utils/formatters';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export default function CajasFinanzasPage() {
  const { token } = useAuth();
  const [registers, setRegisters] = useState([]);
  const [openingAmountPen, setOpeningAmountPen] = useState('200.00');
  const [notes, setNotes] = useState('');
  const [movForm, setMovForm] = useState({ movementType: 'INGRESO', paymentMethod: 'EFECTIVO', amountPen: '20.00', concept: '' });
  const [declaredClose, setDeclaredClose] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    try {
      const list = await listCashRegistersApi(token);
      setRegisters(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openReg = registers.find((r) => r.status === 'ABIERTA');

  const handleOpen = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await openCashRegisterApi({ openingAmountPen: Math.max(0, Number(openingAmountPen) || 0), notes }, token);
      setNotice('Caja abierta correctamente.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    if (!openReg) return;
    setError('');
    try {
      await recordCashMovementApi(openReg.id, {
        ...movForm,
        amountPen: Math.max(0.01, Number(movForm.amountPen) || 0.01),
      }, token);
      setNotice('Movimiento registrado en caja activa.');
      setMovForm({ ...movForm, concept: '' });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClose = async () => {
    if (!openReg) return;
    setError('');
    try {
      const val = declaredClose !== '' ? Math.max(0, Number(declaredClose)) : Number(openReg.expected_closing_pen);
      await closeCashRegisterApi(openReg.id, val, token);
      setNotice('Caja cerrada y arqueo guardado.');
      setDeclaredClose('');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '18px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        Apertura de caja por sede, ingresos/egresos controlados sin montos negativos y arqueo de cierre auditable.
      </p>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}

      {!openReg ? (
        <form className="card" onSubmit={handleOpen} style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <div>
            <label className="form-label">Monto de apertura (PEN)</label>
            <input type="number" min="0" step="0.01" className="form-input" value={openingAmountPen} onChange={(e) => setOpeningAmountPen(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Observaciones</label>
            <input className="form-input" placeholder="Turno mañana / tarde" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" variant="primary">Abrir Caja de Sede</Button>
        </form>
      ) : (
        <div className="card" style={{ padding: '20px', display: 'grid', gap: '16px', border: '1px solid var(--color-gold-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <Badge variant="success">CAJA ABIERTA</Badge>
              <h2 style={{ margin: '6px 0 0', fontSize: '18px' }}>
                Saldo Esperado Actual: <span style={{ color: 'var(--color-gold)' }}>{formatCurrencyPen(openReg.expected_closing_pen)}</span>
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Apertura por {openReg.opened_by} · Fondo inicial {formatCurrencyPen(openReg.opening_amount_pen)}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" min="0" step="0.01" className="form-input" style={{ width: '160px' }} placeholder="Arqueo S/" value={declaredClose} onChange={(e) => setDeclaredClose(e.target.value)} />
              <Button variant="secondary" onClick={handleClose}>Cerrar Caja</Button>
            </div>
          </div>

          <form onSubmit={handleMovement} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', alignItems: 'end' }}>
            <select className="form-select" value={movForm.movementType} onChange={(e) => setMovForm({ ...movForm, movementType: e.target.value })}>
              <option value="INGRESO">INGRESO (+)</option>
              <option value="EGRESO">EGRESO (-)</option>
            </select>
            <select className="form-select" value={movForm.paymentMethod} onChange={(e) => setMovForm({ ...movForm, paymentMethod: e.target.value })}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="YAPE">Yape / Plin</option>
              <option value="POS">Tarjeta POS</option>
            </select>
            <input type="number" min="0.01" step="0.01" className="form-input" placeholder="Monto S/" value={movForm.amountPen} onChange={(e) => setMovForm({ ...movForm, amountPen: e.target.value })} required />
            <input className="form-input" placeholder="Concepto obligatorio *" value={movForm.concept} onChange={(e) => setMovForm({ ...movForm, concept: e.target.value })} required />
            <Button type="submit" variant="primary">Registrar Movimiento</Button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Responsable Apertura</th><th>Inicial</th><th>Esperado</th><th>Declarado</th><th>Estado</th><th>Cierre</th></tr>
          </thead>
          <tbody>
            {registers.map((r) => (
              <tr key={r.id}>
                <td>{r.opened_by}</td>
                <td>{formatCurrencyPen(r.opening_amount_pen)}</td>
                <td style={{ fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrencyPen(r.expected_closing_pen)}</td>
                <td>{r.declared_closing_pen != null ? formatCurrencyPen(r.declared_closing_pen) : '—'}</td>
                <td><Badge variant={r.status === 'ABIERTA' ? 'success' : 'neutral'}>{r.status}</Badge></td>
                <td style={{ fontSize: '12px' }}>{r.closed_by || 'En curso'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
