// ==============================================================================
// GYM VIP — Pantalla: EmpresasSedesPage (Empresas, Gimnasios y Sedes Multi-Sucursal)
// Consume /api/v1/enterprise/gyms y /api/v1/enterprise/branches (EMP-01)
// ==============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { httpClient } from '../../api/httpClient';
import { hasPermission } from '../../services/permissionsService';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icons';
import { LoadingState, EmptyState } from '../../components/feedback/LoadingState';

export default function EmpresasSedesPage() {
  const { token, user } = useAuth();
  const canManage = hasPermission(user, 'branches.manage');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    organizationId: '',
    code: '',
    name: '',
    city: 'Lima',
    district: '',
    address: '',
    phone: '',
    scheduleSummary: '',
    servicesSummary: '',
    capacity: 150,
  });

  const loadEnterprise = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await httpClient('/api/v1/enterprise/branches', {}, token);
      const data = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data?.message || 'No se pudo consultar las sedes de tu empresa.');
      }
      setBranches(data);
    } catch (e) {
      setError(e.message || 'No se pudieron consultar las organizaciones y sedes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadEnterprise();
  }, [loadEnterprise]);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim() || !form.city.trim() || !form.district.trim() || !form.address.trim()) {
      setError('Complete los campos obligatorios de la sede.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        organizationId: form.organizationId || undefined,
        capacity: Math.max(1, Number(form.capacity) || 100),
      };
      const res = await httpClient('/api/v1/enterprise/branches', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'No se pudo registrar la nueva sede.');
      }
      setNotice(`Sede «${form.name}» registrada. Puedes publicarla después de revisar sus datos.`);
      setShowCreate(false);
      setForm((prev) => ({ ...prev, code: '', name: '', district: '', address: '', phone: '' }));
      await loadEnterprise();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateBranch = async (branch, action) => {
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const path = '/api/v1/enterprise/branches/' + encodeURIComponent(branch.id) + '/' + action;
      const response = await httpClient(path, action === 'primary' ? { method: 'PUT' } : {
        method: 'PATCH',
        body: JSON.stringify({ published: !branch.published }),
      }, token);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'No se pudo actualizar la sede.');
      }
      await loadEnterprise();
      setNotice(action === 'primary' ? 'Sede principal actualizada.' : branch.published ? 'Sede retirada del directorio.' : 'Sede habilitada para aparecer en la ficha pública.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
          Registra las sedes de tu empresa, elige tu sede principal y decide cuáles aparecen en la ficha pública.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadEnterprise} disabled={loading}>
            <Icon name="refresh" size={15} />
            <span>Actualizar</span>
          </Button>
          {canManage && (
            <Button variant="primary" onClick={() => setShowCreate((v) => !v)}>
              <Icon name="plus" size={15} />
              <span>{showCreate ? 'Cancelar' : 'Nueva Sede'}</span>
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}

      {showCreate && canManage && (
        <form className="card" onSubmit={handleCreateBranch} style={{ padding: '20px', display: 'grid', gap: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', color: 'var(--color-gold)' }}>Registrar Nueva Sede</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            <div>
              <label className="form-label" htmlFor="branch-code">Código único *</label>
              <input id="branch-code" className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="lima-norte" required />
            </div>
            <div>
              <label className="form-label" htmlFor="branch-name">Nombre de sede *</label>
              <input id="branch-name" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sede Lima Norte" required />
            </div>
            <div>
              <label className="form-label" htmlFor="branch-city">Ciudad *</label>
              <input id="branch-city" className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div>
              <label className="form-label" htmlFor="branch-district">Distrito *</label>
              <input id="branch-district" className="form-input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Los Olivos" required />
            </div>
            <div>
              <label className="form-label" htmlFor="branch-address">Dirección *</label>
              <input id="branch-address" className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div>
              <label className="form-label" htmlFor="branch-schedule">Horario de atención</label>
              <input id="branch-schedule" className="form-input" value={form.scheduleSummary}
                onChange={(e) => setForm({ ...form, scheduleSummary: e.target.value })} placeholder="Lun–Vie 06:00–22:00" />
            </div>
            <div>
              <label className="form-label" htmlFor="branch-capacity">Aforo máximo</label>
              <input id="branch-capacity" type="number" min="1" className="form-input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Math.max(1, Number(e.target.value) || 1) })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Guardando…' : 'Crear Sede'}</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card" style={{ padding: '24px' }}><LoadingState message="Consultando empresas y sedes..." /></div>
      ) : branches.length === 0 ? (
        <div className="card" style={{ padding: '24px' }}>
          <EmptyState title="Sin sedes registradas" description="Registre la primera sucursal para habilitar operación multi-sede." />
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Sede</th>
                <th>Ciudad / Distrito</th>
                <th>Dirección</th>
                <th>Horario</th>
                <th>Aforo</th>
                <th>Estado</th>
                {canManage && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id || b.code}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-gold)' }}>{b.code}</td>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.city} · {b.district}</td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{b.address}</td>
                  <td style={{ fontSize: '12px' }}>{b.scheduleSummary || '—'}</td>
                  <td>{b.capacity ?? '—'} pers.</td>
                  <td>
                    <Badge variant={b.status === 'ACTIVO' ? 'success' : 'neutral'}>{b.status || 'ACTIVO'}</Badge>
                    <span> {b.published ? 'Visible' : 'Privada'}</span>
                  </td>
                  {canManage && (
                    <td>
                      <Button variant="secondary" disabled={submitting} onClick={() => updateBranch(b, 'primary')}>Usar como principal</Button>
                      <Button variant="secondary" disabled={submitting} onClick={() => updateBranch(b, 'publication')}>{b.published ? 'Ocultar' : 'Publicar'}</Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
