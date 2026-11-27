// ==============================================================================
// GYM VIP — Pantalla: ClasesEntrenamientoPage (Entrenamiento y Clases EMP-04/05)
// ==============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { getBranchesApi } from '../../api/staffApi';
import { listClassReservationsApi, listClassTrainersApi } from '../../api/enterpriseOpsApi';
import ExerciseManagementPanel from './ExerciseManagementPanel';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../services/permissionsService';
import {
  listTrainingClassesApi,
  createTrainingClassApi,
  listTrainingRoutinesApi,
  listTrainingExercisesApi,
  createTrainingRoutineApi,
} from '../../api/enterpriseOpsApi';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export default function ClasesEntrenamientoPage({ initialClassId }) {
  const { token, user } = useAuth();
  const canManageClasses = hasPermission(user, 'training.classes.manage');
  const canCreateRoutine = hasPermission(user, 'training.routines.create');
  const canReadRoster = hasPermission(user, 'training.classes.roster');
  const canReadRoutines = hasPermission(user, 'training.routines.read');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [trainers, setTrainers] = useState([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId ?? '');
  const rosterHeading = useRef(null);
  const [roster, setRoster] = useState({ loading: false, items: [], error: '' });
  const [classesList, setClassesList] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [classForm, setClassForm] = useState({ title: '', category: 'FUNCIONAL', trainerAccountId: '', startsAt: `${new Date().toLocaleDateString("sv-SE", { timeZone: "America/Lima" })}T18:00`, durationMinutes: 60, capacity: 20 });
  const [routineForm, setRoutineForm] = useState({ title: '', goal: 'Hipertrofia', level: 'INTERMEDIO', durationMinutes: 50, exerciseId: '', notes: '' });

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const [cls, rts, exs] = await Promise.all([
        canReadRoster || canManageClasses ? listTrainingClassesApi(token) : [],
        canReadRoutines ? listTrainingRoutinesApi(token) : [],
        canCreateRoutine ? listTrainingExercisesApi(token) : [],
      ]);
      setClassesList(Array.isArray(cls) ? cls : []);
      setRoutines(Array.isArray(rts) ? rts : []);
      setExercises(Array.isArray(exs) ? exs : []);
    } catch (e) {
      setError(e.message);
    }
  }, [token, canReadRoster, canManageClasses, canReadRoutines, canCreateRoutine]);

  useEffect(() => {
    let active = true;
    getBranchesApi(token).then((result) => {
      if (!active) return;
      const available = result.filter((branch) => branch.status === 'ACTIVO');
      setBranches(available);
      setBranchId(available[0]?.id ?? '');
    }).catch(() => { if (active) setError('No se pudieron consultar las sedes.'); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!canManageClasses || !branchId) return;
    let active = true;
    listClassTrainersApi(branchId, token).then((result) => {
      if (active) setTrainers(result);
    }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [branchId, canManageClasses, token]);

  useEffect(() => {
    if (!selectedClass || !canReadRoster) return;
    rosterHeading.current?.focus();
    let active = true;
    setRoster({ loading: true, items: [], error: '' });
    listClassReservationsApi(selectedClass, token).then((items) => {
      if (active) setRoster({ loading: false, items, error: '' });
    }).catch((err) => { if (active) setRoster({ loading: false, items: [], error: err.message }); });
    return () => { active = false; };
  }, [selectedClass, canReadRoster, token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTrainingClassApi({
        ...classForm,
        branchId,
        trainerAccountId: classForm.trainerAccountId || null,
        startsAt: classForm.startsAt.length === 16 ? `${classForm.startsAt}:00` : classForm.startsAt,
        durationMinutes: Math.max(15, Number(classForm.durationMinutes)),
        capacity: Math.max(1, Number(classForm.capacity)),
      }, token);
      setNotice(`Clase grupal «${classForm.title}» publicada para reservas en app móvil.`);
      setClassForm({ ...classForm, title: '' });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTrainingRoutineApi({
        title: routineForm.title,
        goal: routineForm.goal,
        level: routineForm.level,
        durationMinutes: Math.max(10, Number(routineForm.durationMinutes)),
        personal: false,
        notes: routineForm.notes,
        items: routineForm.exerciseId ? [{ exerciseId: routineForm.exerciseId, setsCount: 4, repsTarget: '10-12', restSeconds: 90 }] : [],
      }, token);
      setNotice(`Rutina «${routineForm.title}» registrada y visible en el portal del socio.`);
      setRoutineForm({ ...routineForm, title: '', notes: '' });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '18px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        Programación de clases grupales con control de cupos concurrentes y biblioteca de rutinas para entrenadores y socios.
      </p>

      {error && <Alert variant="danger" message={error} onClose={() => setError('')} />}
      {notice && <Alert variant="success" message={notice} onClose={() => setNotice('')} />}

      {branches.length > 0 && (
        <TextField select size="small" label="Sede de trabajo" value={branchId}
          onChange={(event) => {
            setTrainers([]);
            setClassForm((current) => ({ ...current, trainerAccountId: '' }));
            setBranchId(event.target.value);
          }}>
          {branches.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
        </TextField>
      )}
      <ExerciseManagementPanel key={branchId} user={user} token={token} branchId={branchId} onPublished={loadAll} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        {canManageClasses && (
          <form className="card" onSubmit={handleCreateClass} style={{ padding: '18px', display: 'grid', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', color: 'var(--color-gold)' }}>Nueva Clase Grupal</h2>
            <input className="form-input" placeholder="Nombre de clase (ej. HIIT VIP Evening) *" value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input className="form-input" placeholder="Categoría" value={classForm.category} onChange={(e) => setClassForm({ ...classForm, category: e.target.value })} />
              <TextField select label="Entrenador" size="small" value={classForm.trainerAccountId} required
                onChange={(e) => setClassForm({ ...classForm, trainerAccountId: e.target.value })}>
                <MenuItem value="">Seleccionar entrenador</MenuItem>
                {trainers.map((trainer) => <MenuItem key={trainer.id} value={trainer.id}>{trainer.name}</MenuItem>)}
              </TextField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: '8px' }}>
              <input type="datetime-local" className="form-input" value={classForm.startsAt} onChange={(e) => setClassForm({ ...classForm, startsAt: e.target.value })} required />
              <input type="number" min="15" className="form-input" placeholder="Min" value={classForm.durationMinutes} onChange={(e) => setClassForm({ ...classForm, durationMinutes: Math.max(15, Number(e.target.value) || 15) })} />
              <input type="number" min="1" className="form-input" placeholder="Cupos" value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: Math.max(1, Number(e.target.value) || 1) })} />
            </div>
            <Button type="submit" variant="primary" disabled={!branchId || !classForm.trainerAccountId}>Publicar clase</Button>
          </form>
        )}

        {canCreateRoutine && (
          <form className="card" onSubmit={handleCreateRoutine} style={{ padding: '18px', display: 'grid', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', color: 'var(--color-gold)' }}>Nueva Rutina Oficial</h2>
            <input className="form-input" placeholder="Título de rutina *" value={routineForm.title} onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input className="form-input" placeholder="Objetivo" value={routineForm.goal} onChange={(e) => setRoutineForm({ ...routineForm, goal: e.target.value })} />
              <select className="form-select" value={routineForm.level} onChange={(e) => setRoutineForm({ ...routineForm, level: e.target.value })}>
                <option value="PRINCIPIANTE">Principiante</option>
                <option value="INTERMEDIO">Intermedio</option>
                <option value="AVANZADO">Avanzado</option>
              </select>
            </div>
            <select className="form-select" value={routineForm.exerciseId} onChange={(e) => setRoutineForm({ ...routineForm, exerciseId: e.target.value })}>
              <option value="">Ejercicio inicial base (opcional)…</option>
              {exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} · {ex.muscleGroup}</option>)}
            </select>
            <Button type="submit" variant="primary">Guardar Rutina</Button>
          </form>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Clase</th><th>Sede y horario (Lima)</th><th>Entrenador</th><th>Cupo</th><th>Estado</th>{canReadRoster && <th>Reservas</th>}</tr>
          </thead>
          <tbody>
            {classesList.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.title}</strong></td>
                <td>{c.branchName}<br />{c.startsAt?.replace("T", " ").slice(0, 16)}</td>
                <td>{c.trainerName}</td>
                <td>{c.reservedCount ?? 0} / {c.capacity}</td>
                <td><Badge variant="gold">{c.status}</Badge></td>
                {canReadRoster && <td><Button variant="secondary" onClick={() => setSelectedClass(c.id)}>Ver reservas</Button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canReadRoster && selectedClass && (
        <div className="card" style={{ padding: '18px', overflowX: 'auto' }}>
          <h2 ref={rosterHeading} tabIndex={-1}>Reservas · {classesList.find(({ id }) => id === selectedClass)?.title ?? 'Clase'}</h2>
          {roster.error && <Alert variant="danger" message={roster.error} />}
          {roster.loading && <p role="status">Consultando reservas…</p>}
          {!roster.loading && !roster.error && roster.items.length === 0 && <p>Aún no hay reservas para esta clase.</p>}
          {roster.items.length > 0 && <table className="data-table">
            <thead><tr><th>Socio</th><th>Estado</th><th>Solicitud (Lima)</th><th>Cancelación (Lima)</th></tr></thead>
            <tbody>{roster.items.map((reservation) => (
              <tr key={reservation.id}>
                <td>{reservation.memberName}</td>
                <td>{reservation.status.replaceAll('_', ' ')}</td>
                <td>{reservation.reservedAt?.replace('T', ' ').slice(0, 16)}</td>
                <td>{reservation.cancelledAt?.replace('T', ' ').slice(0, 16) || '—'}</td>
              </tr>
            ))}</tbody>
          </table>}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Rutina</th><th>Objetivo</th><th>Nivel</th><th>Duración</th><th>Ejercicios</th></tr>
          </thead>
          <tbody>
            {routines.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.title}</strong></td>
                <td>{r.goal}</td>
                <td><Badge variant="neutral">{r.level}</Badge></td>
                <td>{r.durationMinutes} min</td>
                <td>{(r.items || []).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
