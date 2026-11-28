import React, { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { httpClient } from '../../api/httpClient.js';

const endpoint = '/api/v1/announcements/drafts';

async function draftRequest(path, options, token) {
  const response = await httpClient(path, options, token);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'No se pudo completar la operación con el aviso.');
  }
  return response.status === 204 ? undefined : response.json();
}

export default function AnnouncementDraftsPanel({ token, canPublish }) {
  const [drafts, setDrafts] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const request = new AbortController();
    draftRequest(endpoint, { signal: request.signal }, token)
      .then((items) => {
        if (!request.signal.aborted) { setDrafts(items); setLoaded(true); }
      })
      .catch((failure) => { if (!request.signal.aborted) setError(failure.message); });
    return () => request.abort();
  }, [token]);

  async function save(event) {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setBusy(true); setError(''); setFeedback('');
    try {
      const draft = await draftRequest(endpoint, {
        method: 'POST', body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      }, token);
      setDrafts((items) => [draft, ...items].slice(0, 50));
      setTitle(''); setMessage('');
      setFeedback('Borrador guardado para revisión.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function publish(id) {
    setBusy(true); setError(''); setFeedback('');
    try {
      await draftRequest(`${endpoint}/${encodeURIComponent(id)}/publish`, { method: 'PATCH' }, token);
      setDrafts((items) => items.filter((item) => item.id !== id));
      setFeedback('Publicado en la bandeja de avisos.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper component="section" sx={{ p: 2, mb: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Borradores de avisos</Typography>
        <Stack component="form" spacing={2} onSubmit={save}>
          <TextField label="Título" value={title} onChange={(event) => setTitle(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 200 } }} required />
          <TextField label="Mensaje" value={message} onChange={(event) => setMessage(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 2000 } }} required multiline minRows={2} />
          <Button type="submit" variant="contained" disabled={busy || !loaded} sx={{ alignSelf: 'start' }}>Guardar borrador</Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {feedback && <Alert severity="success">{feedback}</Alert>}
        {loaded && drafts.length === 0 && <Typography color="text.secondary">Sin borradores pendientes.</Typography>}
        {drafts.map((item) => (
          <Paper component="article" variant="outlined" key={item.id} sx={{ p: 2 }}>
            <Typography component="h3" variant="subtitle1">{item.title}</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.message}</Typography>
            {canPublish && <Button disabled={busy} onClick={() => publish(item.id)}>Publicar en la app</Button>}
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}
