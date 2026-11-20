#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const models = process.env.PIPER_MODELS;
if (!models) throw new Error('Indique le dossier des modèles avec PIPER_MODELS.');
const fromRoot = (path) => fileURLToPath(new URL(path, import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'mbt-voices-'));
const vite = await createServer({
  configFile: false,
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, ws: false },
});
try {
  const { TESTIMONIES } = await vite.ssrLoadModule('/src/data/content.ts');
  const result = spawnSync(process.env.PIPER_PYTHON || 'python3', [
    fromRoot('./synthesize-voices.py'), models, temporary,
  ], {
    input: JSON.stringify(TESTIMONIES.map(({ id, transcriptFr }) => ({ id, transcriptFr }))),
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || 'La génération des voix a échoué.');
  const destination = fromRoot('../public/audio/');
  await mkdir(destination, { recursive: true });
  for (const { id } of TESTIMONIES) {
    const filename = `temoignage-${id}-fr.mp3`;
    await copyFile(join(temporary, filename), join(destination, filename));
  }
  await writeFile(fromRoot('../src/data/testimonyAudio.generated.json'), result.stdout);
  console.log(`${TESTIMONIES.length} pistes et repères de sous-titres générés.`);
} finally {
  await vite.close();
  await rm(temporary, { recursive: true, force: true });
}
