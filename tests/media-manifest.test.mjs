import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildManifest } from '../scripts/media-manifest.mjs';

// O servidor sabe que imagens existem por esta lista (não lê o disco). Se não
// corresponder a public/media, uma imagem nova não aparece no site.
test('media manifest matches public/media (run: node scripts/media-manifest.mjs)', () => {
  const committed = JSON.parse(readFileSync('src/lib/media-manifest.json', 'utf8'));
  assert.deepEqual(committed, buildManifest());
});
