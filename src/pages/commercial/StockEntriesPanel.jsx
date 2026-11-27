import { useState, useEffect, useRef } from 'react';
import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { getBranchesApi } from '../../api/staffApi';
import { listBranchSupplementStockApi, receiveSupplementStockApi } from '../../api/supplementStockApi';
import { hasPermission } from '../../services/permissionsService';

export default function StockEntriesPanel({ token, user, selectedId, initialBranchId, onStockChanged }) {
  const canReceive = hasPermission(user, 'supplements.stock.receive');
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(initialBranchId ?? '');
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const request = useRef(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    getBranchesApi(token).then((response) => {
      if (!active) return;
      const available = response.filter((branch) => branch.status === 'ACTIVO');
      setBranches(available);
      setBranchId((current) => available.some(({ id }) => id === current) ? current : available[0]?.id ?? '');
    }).catch(() => active && setMessage({ severity: 'error', text: 'No se pudieron cargar tus sedes.' }));
    return () => { active = false; };
  }, [open, token]);

  useEffect(() => {
    if (!open || !branchId) return;
    let active = true;
    setLoading(true);
    listBranchSupplementStockApi(branchId, token).then((response) => {
      if (!active) return;
      setItems(response);
      setItemId((current) => response.some(({ supplementId }) => supplementId === selectedId) ? selectedId
        : response.some(({ supplementId }) => supplementId === current) ? current : '');
    }).catch((error) => {
      if (active) setMessage({ severity: 'error', text: error.message });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [branchId, open, selectedId, token]);

  const selected = items.find(({ supplementId }) => supplementId === itemId);
  async function submit(event) {
    event.preventDefault();
    if (busy || loading || !selected || !reason.trim()) return;
    const payload = { branchId, quantity: Number(quantity), reason: reason.trim() };
    const fingerprint = JSON.stringify([itemId, payload]);
    if (request.current?.fingerprint !== fingerprint) {
      request.current = { fingerprint, id: crypto.randomUUID() };
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await receiveSupplementStockApi(itemId, { ...payload, requestId: request.current.id }, token);
      request.current = null;
      setItems((current) => current.map((item) => item.supplementId === itemId
        ? { ...item, currentStock: result.newStock } : item));
      setQuantity('');
      setReason('');
      onStockChanged?.();
      setMessage({ severity: 'success', text: 'Entrada registrada en el kardex. Stock actualizado a ' + result.newStock + ' unidades.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Stock de suplementos por sede</Typography>
            <Button variant="outlined" aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? 'Cerrar panel' : canReceive ? 'Registrar entrada' : 'Consultar stock'}
            </Button>
          </Stack>
          {open && (
            <Stack component="form" spacing={2} onSubmit={submit}>
              {message && <Alert severity={message.severity}>{message.text}</Alert>}
              <TextField select label="Sede" value={branchId} disabled={busy || branches.length === 0}
                onChange={(event) => { setItems([]); setItemId(''); setMessage(null); setBranchId(event.target.value); }}>
                {branches.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
              </TextField>
              {branches.length === 0 && <Typography color="text.secondary">No hay sedes habilitadas para esta cuenta.</Typography>}
              {loading && <Typography role="status">Consultando stock…</Typography>}
              {branchId && !loading && items.length === 0 && <Typography color="text.secondary">Esta sede todavía no tiene suplementos.</Typography>}
              {items.length > 0 && <TextField select label="Suplemento" value={itemId} disabled={busy || loading}
                onChange={(event) => { setItemId(event.target.value); setMessage(null); }}>
                <MenuItem value="">Seleccionar suplemento</MenuItem>
                {items.map((item) => <MenuItem key={item.supplementId} value={item.supplementId}>
                  {item.name} · {item.currentStock} unidades
                </MenuItem>)}
              </TextField>}
              {selected && canReceive && <>
                <TextField label="Unidades a ingresar" type="number" value={quantity} required disabled={busy}
                  slotProps={{ htmlInput: { min: 1, max: 100000, step: 1 } }}
                  onChange={(event) => setQuantity(event.target.value)} />
                <TextField label="Motivo de la entrada" value={reason} required disabled={busy}
                  slotProps={{ htmlInput: { maxLength: 400 } }} onChange={(event) => setReason(event.target.value)} />
                <Button type="submit" variant="contained" disabled={busy || loading || !quantity || !reason.trim()}>
                  {busy ? 'Registrando…' : 'Confirmar entrada'}
                </Button>
              </>}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
