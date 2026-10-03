import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildStopEntries, isValidEntryOrder } from '../src/utils/routeStopEntries.ts';
import {
  buildQueueItems, buildTripStops, tripStopKind,
} from '../src/utils/tripStops.ts';

const at = (lat, lng) => ({ latitude: lat, longitude: lng });

const passenger = (id, pickup, dropoff) => ({
  userId: id,
  name: `Passenger ${id}`,
  initials: `P${id}`,
  pickupLocation: pickup,
  dropoffLocation: dropoff,
  attendanceStatus: 'present',
});

const A = at(6.90, 79.85);
const B = at(6.91, 79.86);
const C = at(6.92, 79.87);
const SCHOOL = at(6.95, 79.90);

const entry = (kind, location, ...passengers) => ({
  id: `${kind}-${passengers.map((p) => p.userId).join('-')}`,
  kind,
  location,
  passengers,
});

test('keeps pickups and drop-offs as separate stops when they are apart', () => {
  const p1 = passenger('1', A, SCHOOL);
  const p2 = passenger('2', B, SCHOOL);
  const stops = buildTripStops([
    entry('pickup', A, p1), entry('pickup', B, p2), entry('dropoff', SCHOOL, p1, p2),
  ]);

  assert.equal(stops.length, 3);
  assert.deepEqual(stops.map(tripStopKind), ['pickup', 'pickup', 'dropoff']);
  assert.deepEqual(stops[2].dropoffs, [p1, p2]);
});

test('merges a drop-off and a pickup at the same place into one "both" stop', () => {
  const p1 = passenger('1', A, B);
  const p2 = passenger('2', B, C);
  // drop p1 at B, then pick p2 up at B (a few metres away)
  const nearB = at(B.latitude + 0.0001, B.longitude);
  const stops = buildTripStops([
    entry('pickup', A, p1), entry('dropoff', B, p1), entry('pickup', nearB, p2), entry('dropoff', C, p2),
  ]);

  assert.equal(stops.length, 3);
  assert.equal(tripStopKind(stops[1]), 'both');
  assert.deepEqual(stops[1].dropoffs, [p1]);
  assert.deepEqual(stops[1].pickups, [p2]);
});

test('only merges neighbours, never reorders the route', () => {
  const p1 = passenger('1', A, B);
  const p2 = passenger('2', C, B);
  // pickup at A, pickup at C, then a drop-off back at A's location: not adjacent to A
  const stops = buildTripStops([
    entry('pickup', A, p1), entry('pickup', C, p2), entry('dropoff', A, p1),
  ]);

  assert.equal(stops.length, 3);
  assert.deepEqual(stops.map(tripStopKind), ['pickup', 'pickup', 'dropoff']);
});

test('supports a mixed order: pickups, a drop-off in between, then more pickups', () => {
  const ps = [1, 2, 3, 4].map((n) => passenger(String(n), at(6.9 + n * 0.01, 79.85), at(7.2 + n * 0.01, 79.85)));
  const order = [
    entry('pickup', ps[0].pickupLocation, ps[0]),
    entry('pickup', ps[1].pickupLocation, ps[1]),
    entry('dropoff', ps[0].dropoffLocation, ps[0]),
    entry('pickup', ps[2].pickupLocation, ps[2]),
  ];
  const stops = buildTripStops(order);

  assert.deepEqual(stops.map(tripStopKind), ['pickup', 'pickup', 'dropoff', 'pickup']);
});

test('gives each stop a stable, unique id', () => {
  const p1 = passenger('1', A, SCHOOL);
  const p2 = passenger('2', B, SCHOOL);
  const entries = [entry('pickup', A, p1), entry('pickup', B, p2), entry('dropoff', SCHOOL, p1, p2)];
  const ids = buildTripStops(entries).map((s) => s.id);

  assert.equal(new Set(ids).size, 3);
  assert.deepEqual(ids, buildTripStops(entries).map((s) => s.id));
});

test('queue lists drop-offs before pickups within a stop, one item per action', () => {
  const p1 = passenger('1', A, B);
  const p2 = passenger('2', B, C);
  const stops = buildTripStops([
    entry('pickup', A, p1), entry('dropoff', B, p1), entry('pickup', B, p2), entry('dropoff', C, p2),
  ]);
  const items = buildQueueItems(stops);

  assert.deepEqual(
    items.map((i) => [i.stopIndex, i.kind, i.passenger.userId]),
    [[0, 'pickup', '1'], [1, 'dropoff', '1'], [1, 'pickup', '2'], [2, 'dropoff', '2']],
  );
  assert.equal(new Set(items.map((i) => i.key)).size, items.length);
});

test('default Route order (all pickups, then drop-offs) builds a valid trip that ends on a drop-off', () => {
  const p1 = passenger('1', A, SCHOOL);
  const p2 = passenger('2', B, SCHOOL);
  const entries = buildStopEntries([p1, p2]);
  const stops = buildTripStops(entries);

  assert.equal(isValidEntryOrder(entries), true);
  assert.equal(tripStopKind(stops[stops.length - 1]), 'dropoff');
});

test('rejects an order that drops someone off before picking them up', () => {
  const p1 = passenger('1', A, B);
  const p2 = passenger('2', C, B);
  const pickup1 = entry('pickup', A, p1);
  const pickup2 = entry('pickup', C, p2);
  const drop1 = entry('dropoff', B, p1);

  assert.equal(isValidEntryOrder([pickup1, drop1, pickup2]), true);
  assert.equal(isValidEntryOrder([drop1, pickup1, pickup2]), false);
  assert.equal(isValidEntryOrder([pickup2, drop1, pickup1]), false);
});
