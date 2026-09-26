import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

const { outputText } = ts.transpileModule(readFileSync('src/lib/hours.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const mod = { exports: {} };
new Function('module', 'exports', outputText)(mod, mod.exports);
const { mergeHours, summarizeHours, monthRange, vehicleLabel } = mod.exports;

const me = 'u1', other = 'u2';
const vehicle = [
  { id: 'v1', car_id: 'c1', work_date: '2026-09-10', start_time: '09:00:00', end_time: '12:30:00', hours: '3.5', description: 'Troca de embraiagem', created_by: me, car: { make: 'Yamaha', model: 'R6', license_plate: 'AA-11-BB' } },
  { id: 'v2', car_id: 'c2', work_date: '2026-09-12', start_time: '14:00:00', end_time: null, hours: 0, description: null, created_by: other, car: { make: 'BMW por identificar', model: '—', license_plate: null } },
];
const others = [
  { id: 'o1', profile_id: me, work_date: '2026-09-10', start_time: '13:30:00', end_time: '15:00:00', hours: 1.5, description: 'Limpeza da oficina' },
];

test('vehicle hours and other tasks merge into one list, newest first', () => {
  const list = mergeHours(vehicle, others);
  assert.deepEqual(list.map((e) => e.id), ['v2', 'o1', 'v1']);
  assert.equal(list[2].vehicle.label, 'Yamaha R6 · AA-11-BB');
  assert.equal(list[2].start, '09:00');
  assert.equal(list[0].description, 'Trabalho na viatura');
  assert.equal(list[0].vehicle.label, 'BMW por identificar');
});

test('totals split vehicle vs other time, per person, and count open shifts', () => {
  const s = summarizeHours(mergeHours(vehicle, others));
  assert.equal(s.total, 5);
  assert.equal(s.vehicle, 3.5);
  assert.equal(s.other, 1.5);
  assert.equal(s.open, 1);
  assert.deepEqual(s.byPerson[0], { personId: me, total: 5, vehicle: 3.5, other: 1.5 });
});

test('month range handles bad input, month length and year boundaries', () => {
  assert.deepEqual(monthRange('2026-02', '2026-09-26'), { month: '2026-02', from: '2026-02-01', to: '2026-02-28', prev: '2026-01', next: '2026-03' });
  assert.equal(monthRange('lixo', '2026-12-05').month, '2026-12');
  assert.equal(monthRange(undefined, '2026-12-05').next, '2027-01');
  assert.equal(monthRange('2026-01', '2026-12-05').prev, '2025-12');
  assert.equal(vehicleLabel(null), 'Viatura');
});
