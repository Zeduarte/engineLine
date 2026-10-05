import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

const { outputText } = ts.transpileModule(readFileSync('src/lib/badges.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const mod = { exports: {} };
new Function('module', 'exports', outputText)(mod, mod.exports);
const B = mod.exports;

const now = Date.parse('2026-10-05T12:00:00Z');
const moto = { status: 'published', price: 19250, previousPrice: null, national: true, createdAt: '2026-10-01T10:00:00Z', mileage: 9574 };

test('by default Nacional, Novidade and Poucos km are the same orange', () => {
  const b = B.badgesFor(moto, B.mergeBadges(null), now);
  assert.deepEqual(b.map((x) => x.label), ['Nacional', 'Novidade', 'Poucos km']);
  assert.equal(new Set(b.map((x) => x.color)).size, 1);
  assert.equal(b[0].color, B.BADGE_ORANGE);
});

test('colour, text and on/off come from Definições; bad values fall back to defaults', () => {
  const defs = B.mergeBadges({ items: [
    { id: 'national', label: 'Carro nacional', color: '#0ea5e9', enabled: true },
    { id: 'new', enabled: false },
    { id: 'low_km', color: 'vermelho', label: '   ' },
  ] });
  const b = B.badgesFor(moto, defs, now);
  assert.deepEqual(b.map((x) => [x.label, x.color]), [['Carro nacional', '#0EA5E9'], ['Poucos km', B.BADGE_ORANGE]]);
  assert.equal(defs.filter((d) => d.auto).length, 6, 'as automáticas existem sempre');
});

test('stand badges are added in Definições and ticked per vehicle; status comes first; max 3', () => {
  const defs = B.mergeBadges({ items: [{ id: 'iva-x1', label: 'IVA dedutível', color: '#10B981', enabled: true }, { id: 'national', label: 'x', auto: false }] });
  assert.equal(defs.find((d) => d.id === 'iva-x1').auto, false);
  assert.equal(defs.find((d) => d.id === 'national').auto, true, 'não se transforma uma automática');
  const b = B.badgesFor({ ...moto, status: 'reserved', customBadges: ['iva-x1', 'apagada'] }, defs, now);
  assert.deepEqual(b.map((x) => x.id), ['reserved', 'iva-x1', 'national']);
});

test('text colour keeps every badge readable', () => {
  assert.equal(B.textOn('#F5F5F5'), '#0A0A0A');
  assert.equal(B.textOn('#111111'), '#FFFFFF');
  assert.equal(B.textOn('#EF4444'), '#FFFFFF');
  assert.equal(B.textOn(B.BADGE_ORANGE), '#0A0A0A', 'laranja com texto escuro, como antes');
  assert.match(B.newBadgeId('IVA dedutível!', 0.5), /^iva-dedutivel-[0-9a-z]{4}$/);
});
