import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { hasPermission } from '../../services/permissionsService';
import { listManagedExercisesApi, publishExerciseApi, saveExerciseDraftApi } from '../../api/enterpriseOpsApi';

const emptyDraft = {
  name: '', muscleGroup: '', equipment: '', difficulty: 'INTERMEDIO', technique: '', warnings: '', imageUrl: '', videoUrl: '',
};
const fields = [
  ['name', 'Nombre', 120], ['muscleGroup', 'Grupo muscular', 60], ['equipment', 'Equipo', 80],
  ['technique', 'Técnica y ejecución', 1000], ['warnings', 'Precauciones', 500],
  ['imageUrl', 'Enlace HTTPS a la imagen', 1000], ['videoUrl', 'Enlace HTTPS al video', 1000],
];

export default function ExerciseManagementPanel({ user, token, branchId, onPublished }) {
  const canEdit = hasPermission(user, 'training.exercises.edit');
  const canPublish = hasPermission(user, 'training.exercises.publish');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [id, setId] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!open || !branchId || (!canEdit && !canPublish)) return;
    let active = true;
    listManagedExercisesApi(branchId, token).then((response) => {
      if (active) setItems(response);
    }).catch((error) => { if (active) setMessage({ type: 'error', text: error.message }); });
    return () => { active = false; };
  }, [branchId, canEdit, canPublish, open, reload, token]);

  if (!canEdit && !canPublish) return null;
  const selected = items.find((item) => item.id === id);
  const status = selected?.draft ? 'Borrador pendiente' : selected?.published ? 'Publicado' : 'Nuevo ejercicio';

  function pick(selection) {
    const item = items.find((entry) => entry.id === selection);
    setId(selection);
    setDraft(Object.fromEntries(Object.entries(emptyDraft).map(([key, fallback]) => [
      key, (item?.draft ?? item?.content)?.[key] ?? fallback,
    ])));
    setMessage(null);
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const result = await saveExerciseDraftApi(selected?.editable ? id : null, branchId, draft, token);
      setId(result.id);
      setReload((value) => value + 1);
      setMessage({ type: 'success', text: 'Borrador guardado. Un responsable puede revisarlo y publicarlo.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setMessage(null);
    try {
      await publishExerciseApi(id, token);
      setReload((value) => value + 1);
      setMessage({ type: 'success', text: 'Ejercicio publicado en la app para esta sede.' });
      await onPublished();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Catálogo de ejercicios</Typography>
            <Button variant="outlined" aria-expanded={open} onClick={() => setOpen(!open)} disabled={!branchId}>
              {open ? 'Cerrar catálogo' : 'Gestionar ejercicios'}
            </Button>
          </Stack>
          {open && branchId && (
            <Stack component="form" spacing={2} onSubmit={save}>
              {message && <Alert severity={message.type}>{message.text}</Alert>}
              <TextField select label="Ejercicio" value={selected ? id : ''} onChange={(event) => pick(event.target.value)} disabled={busy}>
                <MenuItem value="">Nuevo ejercicio</MenuItem>
                {items.map((item) => <MenuItem key={item.id} value={item.id}>
                  {(item.draft ?? item.content).name} · {item.editable ? item.draft ? 'Borrador' : 'Sede' : 'Catálogo base'}
                </MenuItem>)}
              </TextField>
              <Chip label={status} sx={{ alignSelf: 'flex-start' }} />
              {fields.map(([key, label, maxLength]) => (
                <TextField key={key} label={label} value={draft[key]} disabled={!canEdit || busy}
                  required={['name', 'muscleGroup', 'equipment', 'technique'].includes(key)}
                  multiline={['technique', 'warnings'].includes(key)} minRows={2}
                  slotProps={{ htmlInput: { maxLength } }}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
              ))}
              <TextField select label="Nivel" value={draft.difficulty} disabled={!canEdit || busy}
                onChange={(event) => setDraft({ ...draft, difficulty: event.target.value })}>
                {['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'].map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}
              </TextField>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {canEdit && <Button type="submit" variant="contained" disabled={busy}>
                  {selected && !selected.editable ? 'Crear borrador para esta sede' : 'Guardar borrador'}
                </Button>}
                {canPublish && selected?.draft && <Button type="button" variant="outlined" disabled={busy}
                  onClick={publish}>Publicar borrador guardado</Button>}
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
