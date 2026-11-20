import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';

async function catalog() {
  const values = new Map();
  let failWrites = false;
  let events = 0;
  Object.assign(globalThis, {
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => {
      if (failWrites) throw new Error('Storage unavailable');
      values.set(key, value);
    } },
    window: { dispatchEvent: () => { events++; } }, Event: class { constructor(type) { this.type = type; } },
  });
  const communications = new SourceTextModule(await readFile(new URL('../src/services/whatsappCommunications.js', import.meta.url), 'utf8'));
  await communications.link(() => new SyntheticModule(['getCommunicationsApi'], function () { this.setExport('getCommunicationsApi', () => {}); }));
  const previews = new SourceTextModule(await readFile(new URL('../src/services/templatePreviews.js', import.meta.url), 'utf8'));
  await previews.link(() => communications);
  await previews.evaluate();
  return { previews: previews.namespace, communications: communications.namespace, values, failWrites: () => { failWrites = true; }, events: () => events };
}

test('Guardar un borrador no cambia la vista previa aprobada; aprobar sí la actualiza y persiste', async () => {
  const { previews, communications, values, events } = await catalog();
  const type = communications.MESSAGE_TYPES[0];
  const changed = type.original + ' Consulta en recepción.';
  communications.saveTemplateDraft(type, changed);
  assert.equal(previews.readApprovedTemplatePreviews()[type.id], type.original);
  previews.approveTemplatePreview(type);
  assert.equal(previews.readApprovedTemplatePreviews()[type.id], changed);
  assert.equal(JSON.parse(values.get(previews.APPROVED_PREVIEWS_KEY))[type.id], changed);
  assert.equal(events(), 1);
});

test('No aprueba una plantilla sin borrador válido', async () => {
  const { previews, communications, events } = await catalog();
  assert.throws(() => previews.approveTemplatePreview(communications.MESSAGE_TYPES[0]));
  assert.equal(events(), 0);
});

test('Un fallo al guardar la aprobación conserva la vista previa anterior y no comunica éxito', async () => {
  const { previews, communications, failWrites, events } = await catalog();
  const type = communications.MESSAGE_TYPES[0];
  communications.saveTemplateDraft(type, type.original + ' Cambio pendiente.');
  failWrites();
  assert.throws(() => previews.approveTemplatePreview(type));
  assert.equal(previews.readApprovedTemplatePreviews()[type.id], type.original);
  assert.equal(events(), 0);
});
