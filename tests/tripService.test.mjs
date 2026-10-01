import assert from 'node:assert/strict';
import test from 'node:test';
import { completeTrip, loadTripHistory, loadTripSummary, startOrResumeTrip } from '../src/services/tripService.ts';

const startTime = '2026-10-01T01:30:00.000Z';
const endTime = '2026-10-01T02:00:00.000Z';
const person = (userId) => ({ userId, name: userId, initials: 'P', pickupLocation: { latitude: 6.9, longitude: 79.8 }, dropoffLocation: { latitude: 7, longitude: 80 }, attendanceStatus: 'present' });
const stops = [
  { id: 'a', location: { latitude: 6.9, longitude: 79.8 }, pickups: [person('p1'), person('p2')], dropoffs: [] },
  { id: 'b', location: { latitude: 7, longitude: 80 }, pickups: [], dropoffs: [person('p1'), person('p2')] },
];
const params = { driverId: 'driver', communityId: 'community', date: '2026-10-01', shift: 'morning', stops };
const log = [{ stopId: 'a', location: stops[0].location, completedAt: endTime, pickedUp: [{ userId: 'p1', name: 'p1' }], droppedOff: [] }];

function fixture() {
  const records = new Map();
  const writes = [];
  const repo = {
    findActive: async (uid, date, shift) => [...records.values()].find(({ data }) => data.driverId === uid && data.date === date && data.shift === shift && ['pending', 'active'].includes(data.status)) ?? null,
    community: async () => ({ driverId: 'driver', memberIds: ['p1', 'p2', 'absent', 'p1'] }),
    create: async (data) => { const id = `trip-${records.size + 1}`; records.set(id, { id, data: structuredClone(data) }); return id; },
    update: async (id, data) => { writes.push({ id, data: structuredClone(data) }); records.get(id).data = { ...records.get(id).data, ...structuredClone(data) }; },
    get: async (id) => records.get(id) ?? null,
    byDriver: async (uid) => [...records.values()].filter(({ data }) => data.driverId === uid),
    byParticipant: async (uid) => [...records.values()].filter(({ data }) => data.participantIds?.includes(uid)),
    legacyByPassenger: async () => [...records.values()].filter(({ data }) => !data.participantIds),
  };
  return { repo, records, writes };
}

test('departure saves the route, shift, date, start time and historical community membership', async () => {
  const { repo, records } = fixture();
  const stored = await startOrResumeTrip(repo, params, startTime);
  const data = records.get(stored.id).data;
  assert.equal(data.startedAt, startTime);
  assert.equal(data.date, params.date);
  assert.equal(data.shift, params.shift);
  assert.equal(data.totalStopsPlanned, 2);
  assert.equal(data.passengersPlanned, 2);
  assert.deepEqual(data.participantIds, ['p1', 'p2', 'absent']);
  assert.deepEqual(data.plannedStops, stops);
});

test('resuming preserves the original route, start time, log and member snapshot', async () => {
  const { repo, records, writes } = fixture();
  const first = await startOrResumeTrip(repo, params, startTime);
  records.get(first.id).data.completedStops = log;
  repo.community = async () => { throw new Error('must not resnapshot membership'); };
  const resumed = await startOrResumeTrip(repo, { ...params, stops: [stops[1]] }, endTime);
  assert.equal(records.size, 1);
  assert.equal(resumed.id, first.id);
  assert.equal(resumed.data.startedAt, startTime);
  assert.deepEqual(resumed.data.plannedStops, stops);
  assert.deepEqual(resumed.data.completedStops, log);
  assert.deepEqual(writes, [{ id: first.id, data: { status: 'active' } }]);
});

test('start rejects unauthenticated users, empty routes and another driver community', async () => {
  const { repo, records } = fixture();
  await assert.rejects(startOrResumeTrip(repo, { ...params, driverId: '' }), /authenticated/);
  await assert.rejects(startOrResumeTrip(repo, { ...params, stops: [] }), /No active stops/);
  await assert.rejects(startOrResumeTrip(repo, { ...params, driverId: 'another-driver' }), /another driver/);
  assert.equal(records.size, 0);
});

test('a resumed trip cannot silently move to a different community', async () => {
  const { repo } = fixture();
  await startOrResumeTrip(repo, params, startTime);
  await assert.rejects(startOrResumeTrip(repo, { ...params, communityId: 'other' }), /changing community/);
});

test('early completion atomically saves accurate totals and makes the trip readable from history', async () => {
  const { repo, writes } = fixture();
  const active = await startOrResumeTrip(repo, params, startTime);
  const completed = await completeTrip(repo, active, log, endTime);
  assert.equal(completed.data.status, 'completed');
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].data.summary, {
    totalStopsPlanned: 2, stopsCompleted: 1, passengersPlanned: 2, passengersCollected: 1, passengersMissed: 1, durationSeconds: 1800,
  });
  assert.equal(writes[0].data.endedAt, endTime);
  assert.deepEqual(writes[0].data.completedStops, log);
  const summary = await loadTripSummary(repo, completed.id, { uid: 'driver', role: 'driver' });
  const history = await loadTripHistory(repo, { uid: 'driver', role: 'driver' });
  assert.deepEqual(history, [summary]);
});

test('automatic last-stop completion includes the last pickup and drop-off exactly once', async () => {
  const { repo } = fixture();
  const active = await startOrResumeTrip(repo, params, startTime);
  const fullLog = [
    { ...log[0], pickedUp: stops[0].pickups.map(({ userId, name }) => ({ userId, name })) },
    { ...log[0], stopId: 'b', pickedUp: [], droppedOff: stops[1].dropoffs.map(({ userId, name }) => ({ userId, name })) },
  ];
  const completed = await completeTrip(repo, active, fullLog, endTime);
  assert.equal(completed.data.summary.stopsCompleted, 2);
  assert.equal(completed.data.summary.passengersCollected, 2);
  assert.equal(completed.data.summary.passengersMissed, 0);
});

test('a failed completion write leaves the active trip unchanged and can be retried', async () => {
  const { repo, records } = fixture();
  const active = await startOrResumeTrip(repo, params, startTime);
  const update = repo.update;
  repo.update = async () => { throw new Error('permission denied'); };
  await assert.rejects(completeTrip(repo, active, log, endTime), /permission denied/);
  assert.equal(records.get(active.id).data.status, 'active');
  assert.equal(active.data.endedAt, null);
  assert.equal(active.data.summary, undefined);
  repo.update = update;
  assert.equal((await completeTrip(repo, active, log, endTime)).data.status, 'completed');
});

test('re-completing a completed trip never changes its end time or totals', async () => {
  const { repo, writes } = fixture();
  const completed = await completeTrip(repo, await startOrResumeTrip(repo, params, startTime), log, endTime);
  const result = await completeTrip(repo, completed, [], '2026-10-02T00:00:00.000Z');
  assert.deepEqual(result, completed);
  assert.equal(writes.length, 1);
});

test('history filters active trips and other drivers and sorts completed journeys newest first', async () => {
  const { repo, records } = fixture();
  const old = await completeTrip(repo, await startOrResumeTrip(repo, params, startTime), log, endTime);
  const recent = await completeTrip(repo, await startOrResumeTrip(repo, { ...params, date: '2026-10-02' }, '2026-10-02T01:00:00Z'), log, '2026-10-02T02:00:00Z');
  await startOrResumeTrip(repo, { ...params, date: '2026-10-03' }, '2026-10-03T01:00:00Z');
  records.set('foreign', { id: 'foreign', data: { ...old.data, driverId: 'other' } });
  // Defensive filtering also protects against malformed query results.
  repo.byDriver = async () => [...records.values()];
  assert.deepEqual((await loadTripHistory(repo, { uid: 'driver', role: 'driver' })).map((trip) => trip.id), [recent.id, old.id]);
});

test('passengers retain historical membership after leaving and cannot see trips before joining', async () => {
  const { repo } = fixture();
  const trip = await completeTrip(repo, await startOrResumeTrip(repo, params, startTime), log, endTime);
  repo.legacyByPassenger = async () => [];
  assert.equal((await loadTripHistory(repo, { uid: 'absent', role: 'passenger' }))[0].id, trip.id);
  assert.deepEqual(await loadTripHistory(repo, { uid: 'new-member', role: 'passenger' }), []);
});

test('legacy history requires actual participation and deduplicates query results', async () => {
  const { repo, records } = fixture();
  const trip = await completeTrip(repo, await startOrResumeTrip(repo, params, startTime), log, endTime);
  records.get(trip.id).data.participantIds = undefined;
  repo.byParticipant = async () => [records.get(trip.id)];
  assert.equal((await loadTripHistory(repo, { uid: 'p1', role: 'passenger' })).length, 1);
  assert.deepEqual(await loadTripHistory(repo, { uid: 'p2', role: 'passenger' }), []);
});

test('direct summary links reject missing, unfinished and unrelated records', async () => {
  const { repo } = fixture();
  const active = await startOrResumeTrip(repo, params, startTime);
  await assert.rejects(loadTripSummary(repo, active.id, { uid: 'driver', role: 'driver' }), /not available/);
  await assert.rejects(loadTripSummary(repo, 'missing', { uid: 'driver', role: 'driver' }), /not available/);
  await completeTrip(repo, active, log, endTime);
  await assert.rejects(loadTripSummary(repo, active.id, { uid: 'stranger', role: 'passenger' }), /not available/);
});

test('history read failures propagate for retry rather than showing a false empty state', async () => {
  const { repo } = fixture();
  repo.byDriver = async () => { throw new Error('network unavailable'); };
  await assert.rejects(loadTripHistory(repo, { uid: 'driver', role: 'driver' }), /network unavailable/);
});
