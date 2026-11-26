// ==============================================================================
// GYM VIP — Pantalla: RecursosHumanosPage (RRHH, Fichas y Turnos EMP-03)
// ==============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listAccountsApi } from '../../api/staffApi';
import { listHrProfilesApi, upsertHrProfileApi, listHrShiftsApi, createHrShiftApi } from '../../api/enterpriseOpsApi';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icons';

export default function RecursosHumanosPage() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profileForm, setProfileForm] = useState({ accountId: '', jobTitle: '', documentNumber: '', shiftPattern: 'Lunes a Sábado 06:00-14:00', specialty: '' });
  const [shiftForm, setShiftForm] = useState({ accountId: '', shiftDate: new Date().toISOString().slice(0, 10), startTime: '07:00', endTime: '15:00', notes: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accs, profs, sh] = await Promise.all([
        listAccountsApi(token).catch(() => []),
        listHrProfilesApi(token),
        listHrShiftsApi(token),
      ]);
      const staff = (Array.isArray(accs) ? accs : []).filter((a) => !a.roles?.includes('CLIENTE'));
      setAccounts(staff);
      setProfiles(Array.isArray(profs) ? profs : []);
      setShifts(Array.isArray(sh) ? sh : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await upsertHrProfileApi(profileForm, token);
      setNotice('Ficha operativa de trabajador actualizada.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createHrShiftApi(shiftForm, token);
      setNotice('Turno programado correctamente.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Fichas laborales, cargos operativos, especialidades de entrenadores y programación de turnos por sede.
        </p>
        <Button variant="secondary" onClick={loadData} disabled={loading}>
          <Icon name="refresh" size={15} />
          <span>Actualizar</span>
        </Button>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        <form className="card" onSubmit={handleSaveProfile} style={{ padding: '18px', display: 'grid', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: 'var(--color-gold)' }}>Registrar / Actualizar Ficha RRHH</h2>
          <select className="form-select" value={profileForm.accountId} onChange={(e) => setProfileForm({ ...profileForm, accountId: e.target.value })} required>
            <option value="">Seleccionar colaborador…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.email} ({a.roles?.[0] || 'STAFF'})</option>)}
          </select>
          <input className="form-input" placeholder="Cargo operativo (ej. Entrenador Jefe)" value={profileForm.jobTitle} onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })} required />
          <input className="form-input" placeholder="DNI / Documento" value={profileForm.documentNumber} onChange={(e) => setProfileForm({ ...profileForm, documentNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })} />
          <input className="form-input" placeholder="Jornada habitual" value={profileForm.shiftPattern} onChange={(e) => setProfileForm({ ...profileForm, shiftPattern: e.target.value })} />
          <Button type="submit" variant="primary">Guardar Ficha RRHH</Button>
        </form>

        <form className="card" onSubmit={handleCreateShift} style={{ padding: '18px', display: 'grid', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: 'var(--color-gold)' }}>Programar Turno de Trabajo</h2>
          <select className="form-select" value={shiftForm.accountId} onChange={(e) => setShiftForm({ ...shiftForm, accountId: e.target.value })} required>
            <option value="">Seleccionar colaborador…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.email}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <input type="date" className="form-input" value={shiftForm.shiftDate} onChange={(e) => setShiftForm({ ...shiftForm, shiftDate: e.target.value })} required />
            <input type="time" className="form-input" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} required />
            <input type="time" className="form-input" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} required />
          </div>
          <input className="form-input" placeholder="Observaciones del turno" value={shiftForm.notes} onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })} />
          <Button type="submit" variant="primary">Programar Turno</Button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Colaborador</th><th>Cargo</th><th>Jornada</th><th>Especialidad</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin fichas RRHH registradas en esta sede.</td></tr>
            ) : profiles.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.first_name ? `${p.first_name} ${p.last_name}` : p.email}</strong><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{p.email}</div></td>
                <td>{p.job_title}</td>
                <td style={{ fontSize: '12px' }}>{p.shift_pattern}</td>
                <td>{p.specialty || '—'}</td>
                <td><Badge variant={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'ACTIVO' : 'INACTIVO'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Fecha</th><th>Colaborador</th><th>Ingreso</th><th>Salida</th><th>Estado</th><th>Notas</th></tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin turnos programados.</td></tr>
            ) : shifts.map((s) => (
              <tr key={s.id}>
                <td>{s.shift_date}</td>
                <td>{s.email}</td>
                <td>{String(s.start_time || '').slice(0, 5)}</td>
                <td>{String(s.end_time || '').slice(0, 5)}</td>
                <td><Badge variant="gold">{s.status}</Badge></td>
                <td style={{ fontSize: '12px' }}>{s.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
