import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPickedUp, secondsSince } from '../src/utils/tripProgress.ts';

const completedStops = [
  { stopId: 'a', pickedUp: [{ userId: 'u1', name: 'A' }], droppedOff: [] },
  { stopId: 'b', pickedUp: [], droppedOff: [{ userId: 'u2', name: 'B' }] },
];

test('schema-v2 pickup status reads shared collected IDs without private passenger logs', () => {
  assert.equal(isPickedUp(['u1'], 'u1'), true);
  assert.equal(isPickedUp(['u1'], 'u2'), false);
  assert.equal(isPickedUp([], 'u1'), false);
});

test('is picked up once a completed stop lists the passenger as picked up', () => {
  assert.equal(isPickedUp(completedStops, 'u1'), true);
});

test('a drop-off or an unlisted passenger is not picked up', () => {
  assert.equal(isPickedUp(completedStops, 'u2'), false);
  assert.equal(isPickedUp(completedStops, 'u3'), false);
});

test('tolerates missing or malformed data', () => {
  assert.equal(isPickedUp(undefined, 'u1'), false);
  assert.equal(isPickedUp([{ stopId: 'x' }, null], 'u1'), false);
  assert.equal(isPickedUp(completedStops, null), false);
});

test('computes whole seconds since a timestamp, never negative', () => {
  const now = Date.parse('2026-01-01T10:00:30.000Z');
  assert.equal(secondsSince('2026-01-01T10:00:00.000Z', now), 30);
  assert.equal(secondsSince('2026-01-01T10:01:00.000Z', now), 0);
});

test('returns null for missing or invalid timestamps', () => {
  assert.equal(secondsSince(null, 0), null);
  assert.equal(secondsSince('nope', 0), null);
});
