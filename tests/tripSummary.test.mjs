import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase/firestore';
import {
  buildTripSummary, canViewTrip, formatTripDate, formatTripDuration, formatTripTime,
  sortTripSummaries, tripTimestamp,
} from '../src/utils/tripSummary.ts';

const person = (userId) => ({ userId, name: userId });
const stop = (id, pickups = [], dropoffs = []) => ({ id, pickups: pickups.map(person), dropoffs: dropoffs.map(person) });
const entry = (stopId, pickups = [], dropoffs = []) => ({ stopId, pickedUp: pickups.map(person), droppedOff: dropoffs.map(person) });
const trip = (overrides = {}) => ({
  schemaVersion: 2, driverId: 'driver', communityId: 'community', date: '2026-10-01', shift: 'morning', status: 'completed',
  startedAt: '2026-10-01T01:30:00Z', endedAt: '2026-10-01T02:45:30Z',
  plannedStops: [stop('a', ['p1', 'p2']), stop('b', ['p3'], ['p1']), stop('c', [], ['p2', 'p3'])],
  completedStops: [entry('a', ['p1', 'p2']), entry('b', ['p3'], ['p1']), entry('c', [], ['p2', 'p3'])],
  participantIds: ['p1', 'p2', 'p3', 'absent'], ...overrides,
});

test('a completed mixed pickup/drop-off trip counts physical stops and unique passengers', () => {
  assert.deepEqual(buildTripSummary('trip', trip()), {
    id: 'trip', date: '2026-10-01', shift: 'morning', startedAt: '2026-10-01T01:30:00.000Z', endedAt: '2026-10-01T02:45:30.000Z',
    totalStopsPlanned: 3, stopsCompleted: 3, passengersPlanned: 3, passengersCollected: 3, passengersMissed: 0, durationSeconds: 4530,
  });
});

test('ending early counts only pickups actually completed, never future stops or drop-offs', () => {
  const summary = buildTripSummary('trip', trip({ completedStops: [entry('a', ['p1', 'p2'])] }));
  assert.equal(summary.totalStopsPlanned, 3);
  assert.equal(summary.stopsCompleted, 1);
  assert.equal(summary.passengersCollected, 2);
  assert.equal(summary.passengersMissed, 1);
});

test('ending before the first stop marks all planned passengers missed', () => {
  const summary = buildTripSummary('trip', trip({ completedStops: [] }));
  assert.equal(summary.passengersCollected, 0);
  assert.equal(summary.passengersMissed, 3);
  assert.equal(summary.stopsCompleted, 0);
});

test('duplicate passenger actions and duplicate stop logs do not inflate totals', () => {
  const summary = buildTripSummary('trip', trip({
    plannedStops: [stop('a', ['p1', 'p1']), stop('b', ['p1', 'p2'])],
    completedStops: [entry('a', ['p1', 'p1']), entry('a', ['p1']), entry('b', [], ['p2'])],
  }));
  assert.equal(summary.passengersPlanned, 2);
  assert.equal(summary.passengersCollected, 1);
  assert.equal(summary.passengersMissed, 1);
  assert.equal(summary.stopsCompleted, 2);
});

test('legacy trips keep unknown planned totals and missed passengers unknown', () => {
  const summary = buildTripSummary('old', trip({ plannedStops: undefined, participantIds: undefined }));
  assert.equal(summary.totalStopsPlanned, null);
  assert.equal(summary.passengersPlanned, null);
  assert.equal(summary.passengersMissed, null);
  assert.equal(summary.passengersCollected, 3);
  assert.equal(summary.stopsCompleted, 3);
});

test('legacy scalar planned counts can be read without a route snapshot', () => {
  const summary = buildTripSummary('old', trip({ plannedStops: undefined, totalStopsPlanned: 5, passengersPlanned: 4 }));
  assert.equal(summary.totalStopsPlanned, 5);
  assert.equal(summary.passengersMissed, 1);
});

test('timestamps accept ISO strings, Date, Firestore Timestamp and serialized seconds', () => {
  const date = new Date('2026-10-01T01:30:00Z');
  for (const value of [date.toISOString(), date, Timestamp.fromDate(date), { seconds: date.getTime() / 1000 }]) {
    assert.equal(tripTimestamp(value), date.toISOString());
  }
});

test('missing, malformed or backwards timestamps do not show invented duration', () => {
  for (const value of [null, undefined, '', 'bad date', {}, { toDate() { throw new Error('bad'); } }]) {
    assert.equal(tripTimestamp(value), null);
  }
  assert.equal(buildTripSummary('trip', trip({ endedAt: null })).durationSeconds, null);
  assert.equal(buildTripSummary('trip', trip({ endedAt: '2026-09-30T00:00:00Z' })).durationSeconds, null);
});

test('duration includes overnight journeys and distinguishes zero from unknown', () => {
  const summary = buildTripSummary('trip', trip({ startedAt: '2026-10-01T23:45:00Z', endedAt: '2026-10-02T00:15:00Z' }));
  assert.equal(summary.durationSeconds, 1800);
  assert.equal(formatTripDuration(0), '0 sec');
  assert.equal(formatTripDuration(59), '59 sec');
  assert.equal(formatTripDuration(60), '1 min');
  assert.equal(formatTripDuration(4530), '1 hr 15 min');
  assert.equal(formatTripDuration(null), 'Not recorded');
});

test('drivers only see completed trips that they drove', () => {
  assert.equal(canViewTrip(trip(), { uid: 'driver', role: 'driver' }), true);
  assert.equal(canViewTrip(trip(), { uid: 'someone-else', role: 'driver' }), false);
  assert.equal(canViewTrip(trip({ status: 'active' }), { uid: 'driver', role: 'driver' }), false);
});

test('membership at departure includes absent passengers and survives community changes', () => {
  assert.equal(canViewTrip(trip(), { uid: 'absent', role: 'passenger' }), true);
  assert.equal(canViewTrip(trip(), { uid: 'new-member', role: 'passenger' }), false);
  assert.equal(canViewTrip(trip({ status: 'pending' }), { uid: 'p1', role: 'passenger' }), false);
});

test('legacy passenger access is denied even when pickup logs prove participation', () => {
  const legacy = trip({ schemaVersion: undefined, participantIds: undefined });
  assert.equal(canViewTrip(legacy, { uid: 'p1', role: 'passenger' }), false);
  assert.equal(canViewTrip(legacy, { uid: 'absent', role: 'passenger' }), false);
  assert.equal(canViewTrip(trip({ participantIds: [] }), { uid: 'p1', role: 'passenger' }), false);
});

test('history sorts by end time newest first with deterministic fallback for legacy dates', () => {
  const older = buildTripSummary('older', trip());
  const newer = buildTripSummary('newer', trip({ endedAt: '2026-10-02T02:00:00Z' }));
  const undated = buildTripSummary('undated', trip({ endedAt: null }));
  const input = [older, undated, newer];
  assert.deepEqual(sortTripSummaries(input).map((item) => item.id), ['newer', 'older', 'undated']);
  assert.deepEqual(input.map((item) => item.id), ['older', 'undated', 'newer']);
});

test('display preserves the recorded calendar date and handles missing times', () => {
  assert.match(formatTripDate('2026-10-01'), /2026/);
  assert.equal(formatTripDate('bad date'), 'Date not recorded');
  assert.equal(formatTripTime(null), 'Not recorded');
  assert.notEqual(formatTripTime('2026-10-01T01:30:00Z'), 'Not recorded');
});
