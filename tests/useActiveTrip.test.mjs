import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { useActiveTrip } from '../src/hooks/useActiveTrip.ts';
import { tripRepository } from '../src/services/tripRepository.ts';
import { auth } from '../firebaseConfig.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const location = { latitude: 6.9, longitude: 79.8 };
const passenger = { userId: 'p1', name: 'Passenger', initials: 'P', pickupLocation: location, dropoffLocation: location, attendanceStatus: 'present' };
const stops = [
  { id: 'pickup', location, pickups: [passenger], dropoffs: [] },
  { id: 'dropoff', location, pickups: [], dropoffs: [passenger] },
];
const params = { stops, shift: 'morning', communityId: 'community' };

async function harness(context) {
  await auth.authStateReady();
  const writes = [];
  let stored = null;
  let creates = 0;
  const repository = {
    findActive: async () => stored?.data.status === 'active' ? stored : null,
    community: async () => ({ driverId: 'driver', memberIds: ['p1'] }),
    create: async (data, route) => { creates++; stored = { id: 'trip', data: structuredClone(data), route: structuredClone(route) }; return 'trip'; },
    update: async (id, data, route) => { writes.push(structuredClone(data)); stored.data = { ...stored.data, ...structuredClone(data) }; if (route) stored.route = structuredClone(route); },
    getRoute: async () => stored?.route ?? null,
    get: async () => stored,
    byDriver: async () => stored ? [stored] : [],
    byParticipant: async () => stored ? [stored] : [],
    legacyByPassenger: async () => [],
  };
  // React 19 still supports this renderer for hook tests but emits a migration
  // notice. Keep all other React warnings visible.
  const originalError = console.error;
  context.mock.method(console, 'error', (...args) => {
    if (String(args[0]).startsWith('react-test-renderer is deprecated.')) return;
    if (String(args[0]).startsWith('[useActiveTrip]')) return;
    originalError(...args);
  });
  const previousUser = auth.currentUser;
  auth.currentUser = { uid: 'driver' };
  context.after(() => { auth.currentUser = previousUser; });
  for (const key of Object.keys(tripRepository)) {
    context.mock.method(tripRepository, key, (...args) => repository[key](...args));
  }
  let result;
  function Probe() { result = useActiveTrip(); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(Probe)); });
  context.after(async () => { await act(async () => renderer.unmount()); });
  return { repository, writes, get result() { return result; }, get stored() { return stored; }, get creates() { return creates; } };
}

test('double start calls create one trip and expose the saved route', async (context) => {
  const hook = await harness(context);
  await act(async () => { await Promise.all([hook.result.startTrip(params), hook.result.startTrip(params)]); });
  assert.equal(hook.creates, 1);
  assert.equal(hook.result.trip.status, 'active');
  assert.equal(hook.result.trip.tripId, 'trip');
  assert.deepEqual(hook.result.trip.allStops, stops);
});

test('duplicate stop taps log once and the final drop-off automatically completes with totals', async (context) => {
  const hook = await harness(context);
  await act(async () => { await hook.result.startTrip(params); });
  await act(async () => { await Promise.all([hook.result.completeStop(), hook.result.completeStop()]); });
  assert.equal(hook.result.trip.currentStopIndex, 1);
  assert.equal(hook.stored.route.completedStops.length, 1);
  assert.equal(hook.result.trip.status, 'active');
  await act(async () => { await hook.result.completeStop(); });
  assert.equal(hook.result.trip.status, 'completed');
  assert.equal(hook.result.trip.nextStop, null);
  assert.equal(hook.stored.route.completedStops.length, 2);
  assert.equal(hook.stored.data.summary.passengersCollected, 1);
  assert.equal(hook.stored.data.summary.passengersMissed, 0);
  assert.equal(hook.stored.data.summary.stopsCompleted, 2);
});

test('end-trip state remains active until persistence succeeds and concurrent actions are blocked', async (context) => {
  const hook = await harness(context);
  await act(async () => { await hook.result.startTrip(params); });
  const update = hook.repository.update;
  let release;
  hook.repository.update = async (...args) => {
    await new Promise((resolve) => { release = resolve; });
    await update(...args);
  };
  let pending;
  await act(async () => { pending = hook.result.endTrip(); });
  assert.equal(hook.result.loading, true);
  assert.equal(hook.result.trip.status, 'active');
  await act(async () => { await hook.result.completeStop(); await hook.result.endTrip(); });
  assert.equal(hook.writes.length, 0);
  await act(async () => { release(); await pending; });
  assert.equal(hook.writes.length, 1);
  assert.equal(hook.result.trip.status, 'completed');
  assert.equal(hook.stored.data.summary.passengersMissed, 1);
});

test('failed End Trip stays active and retries successfully without losing completed stops', async (context) => {
  const hook = await harness(context);
  await act(async () => { await hook.result.startTrip(params); await hook.result.completeStop(); });
  const update = hook.repository.update;
  hook.repository.update = async () => { throw new Error('offline'); };
  await act(async () => { await hook.result.endTrip(); });
  assert.equal(hook.result.trip.status, 'active');
  assert.equal(hook.result.trip.currentStopIndex, 1);
  assert.equal(hook.result.error, 'offline');
  assert.equal(hook.result.loading, false);
  hook.repository.update = update;
  await act(async () => { await hook.result.endTrip(); });
  assert.equal(hook.result.trip.status, 'completed');
  assert.equal(hook.result.error, null);
  assert.equal(hook.stored.route.completedStops.length, 1);
  assert.equal(hook.stored.data.summary.passengersCollected, 1);
});

test('failed stop writes never advance or duplicate a pickup when retried', async (context) => {
  const hook = await harness(context);
  await act(async () => { await hook.result.startTrip(params); });
  const update = hook.repository.update;
  hook.repository.update = async () => { throw new Error('permission denied'); };
  await act(async () => { await hook.result.completeStop(); });
  assert.equal(hook.result.trip.currentStopIndex, 0);
  assert.equal(hook.stored.route.completedStops.length, 0);
  assert.equal(hook.result.error, 'permission denied');
  hook.repository.update = update;
  await act(async () => { await hook.result.completeStop(); });
  assert.equal(hook.result.trip.currentStopIndex, 1);
  assert.equal(hook.stored.route.completedStops.length, 1);
});

test('failed final-stop writes do not report completion until successfully retried', async (context) => {
  const hook = await harness(context);
  await act(async () => { await hook.result.startTrip(params); await hook.result.completeStop(); });
  const update = hook.repository.update;
  hook.repository.update = async () => { throw new Error('offline'); };
  await act(async () => { await hook.result.completeStop(); });
  assert.equal(hook.result.trip.status, 'active');
  assert.equal(hook.result.trip.nextStop.id, 'dropoff');
  assert.equal(hook.stored.data.summary, undefined);
  hook.repository.update = update;
  await act(async () => { await hook.result.completeStop(); });
  assert.equal(hook.result.trip.status, 'completed');
  assert.equal(hook.stored.route.completedStops.length, 2);
});

test('a resumed trip uses the saved route even when today route parameters change', async (context) => {
  const hook = await harness(context);
  const originalStart = '2026-10-01T01:00:00Z';
  hook.repository.findActive = async () => ({ id: 'existing', data: {
    driverId: 'driver', communityId: 'community', shift: 'morning', date: '2026-10-01', status: 'active',
    startedAt: originalStart, endedAt: null, plannedStops: stops, participantIds: ['p1'], completedStops: [],
  } });
  // This fixture's resumed document was created outside its in-memory map.
  hook.repository.update = async (_id, data) => { hook.writes.push(data); };
  await act(async () => { await hook.result.startTrip({ ...params, stops: [stops[1]] }); });
  assert.equal(hook.creates, 0);
  assert.equal(hook.result.trip.tripId, 'existing');
  assert.deepEqual(hook.result.trip.allStops, stops);
  assert.equal(hook.result.trip.nextStop.id, 'pickup');
});

test('a start failure clears loading and allows a successful retry', async (context) => {
  const hook = await harness(context);
  const community = hook.repository.community;
  hook.repository.community = async () => { throw new Error('offline'); };
  await act(async () => { await hook.result.startTrip(params); });
  assert.equal(hook.result.loading, false);
  assert.equal(hook.result.trip.status, 'pending');
  assert.equal(hook.result.error, 'offline');
  hook.repository.community = community;
  await act(async () => { await hook.result.startTrip(params); });
  assert.equal(hook.result.trip.status, 'active');
  assert.equal(hook.result.error, null);
  assert.equal(hook.creates, 1);
});
