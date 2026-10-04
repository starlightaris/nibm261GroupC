const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { readFile } = require('node:fs/promises');
const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { collection, doc, getDoc, getDocs, limit, query, setDoc, updateDoc, where, writeBatch } = require('firebase/firestore');
const { createTripRepository } = require('../src/services/tripRepository.ts');
const { completeTrip, startOrResumeTrip } = require('../src/services/tripService.ts');
const { passengerActiveTripQuery } = require('../src/services/liveTripService.ts');

let environment;
const position = { latitude: 6.9, longitude: 79.8 };
const driverLocation = { ...position, heading: null, updatedAt: '2026-10-03T01:30:00Z' };
const passenger = { userId: 'passenger', name: 'Private Name', initials: 'PN', pickupLocation: position, dropoffLocation: position, attendanceStatus: 'present' };
const stops = [{ id: 'stop', location: position, pickups: [passenger], dropoffs: [] }];
const trip = (overrides = {}) => ({
  schemaVersion: 2, driverId: 'driver', communityId: 'community', date: '2026-10-02', shift: 'morning', status: 'completed',
  startedAt: '2026-10-02T01:00:00Z', endedAt: '2026-10-02T02:00:00Z', participantIds: ['passenger', 'absent'],
  plannedStopIds: ['stop'], plannedPassengerIds: ['passenger'], completedStopIds: ['stop'], collectedPassengerIds: ['passenger'],
  totalStopsPlanned: 1, passengersPlanned: 1, ...overrides,
});

before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run through the Firestore emulator; this test never uses the live project.');
  environment = await initializeTestEnvironment({
    projectId: 'demo-trip-review',
    firestore: { rules: await readFile(require('node:path').join(__dirname, '..', 'firestore.rules'), 'utf8') },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'driver'), { role: 'driver' });
    batch.set(doc(db, 'users', 'passenger'), { role: 'passenger' });
    batch.set(doc(db, 'communities', 'community'), { driverId: 'driver', memberIds: ['passenger', 'absent'] });
    batch.set(doc(db, 'trips', 'completed'), trip());
    batch.set(doc(db, 'trips', 'completed', 'private', 'route'), { plannedStops: stops, completedStops: [] });
    batch.set(doc(db, 'trips', 'foreign'), trip({ driverId: 'other-driver', participantIds: ['other-passenger'] }));
    batch.set(doc(db, 'trips', 'active'), trip({ date: '2026-10-03', status: 'active', endedAt: null }));
    batch.set(doc(db, 'trips', 'active', 'private', 'route'), { plannedStops: stops, completedStops: [] });
    batch.set(doc(db, 'communities', 'tracking-community'), { driverId: 'driver', memberIds: ['passenger', 'new-member'] });
    batch.set(doc(db, 'trips', 'tracking-active'), trip({ communityId: 'tracking-community', date: '2026-10-03', status: 'active', endedAt: null, driverLocation }));
    batch.set(doc(db, 'trips', 'tracking-legacy'), { driverId: 'driver', communityId: 'tracking-community', date: '2026-10-03', status: 'active', plannedStops: stops });
    batch.set(doc(db, 'trips', 'legacy'), {
      driverId: 'driver', communityId: 'community', date: '2026-09-01', shift: 'morning', status: 'completed',
      startedAt: '2026-09-01T01:00:00Z', endedAt: '2026-09-01T02:00:00Z',
      completedStops: [{ stopId: 'old', location: position, pickedUp: [{ userId: 'passenger', name: 'Private Name' }] }],
    });
    for (let i = 0; i < 55; i++) {
      batch.set(doc(db, 'trips', `history-${i}`), trip({ driverId: 'history-driver', participantIds: ['history-member'], endedAt: new Date(Date.UTC(2026, 9, 2, 2, i)).toISOString() }));
    }
    await batch.commit();
  });
});
after(async () => { await environment?.cleanup(); });

test('the exact driver and passenger history queries are permitted and scoped', async () => {
  const driver = createTripRepository(environment.authenticatedContext('driver').firestore());
  assert.deepEqual((await driver.byDriver('driver')).map((record) => record.id), ['completed', 'legacy']);
  const passenger = createTripRepository(environment.authenticatedContext('passenger').firestore());
  assert.deepEqual((await passenger.byParticipant('passenger')).map((record) => record.id), ['completed']);
  assert.equal((await driver.findActive('driver', '2026-10-03', 'morning')).id, 'active');
  assert.equal(await driver.findActive('driver', '2026-10-02', 'morning'), null);
});

test('history fetches the newest 50 rather than an arbitrary subset', async () => {
  const repository = createTripRepository(environment.authenticatedContext('history-driver').firestore());
  const records = await repository.byDriver('history-driver');
  assert.equal(records.length, 50);
  assert.equal(records[0].id, 'history-54');
  assert.equal(records.at(-1).id, 'history-5');
});

test('members can read a completed shared record but never its private route', async () => {
  const db = environment.authenticatedContext('passenger').firestore();
  const snapshot = await assertSucceeds(getDoc(doc(db, 'trips', 'completed')));
  assert.doesNotMatch(JSON.stringify(snapshot.data()), /latitude|longitude|Private Name|pickupLocation/);
  await assertFails(getDoc(doc(db, 'trips', 'completed', 'private', 'route')));
  await assertFails(setDoc(doc(db, 'trips', 'completed', 'private', 'route'), { plannedStops: [] }));
  await assertSucceeds(getDoc(doc(db, 'trips', 'active')));
  await assertFails(getDoc(doc(db, 'trips', 'active', 'private', 'route')));
  await assertFails(getDoc(doc(db, 'trips', 'foreign')));
  await assertFails(getDoc(doc(db, 'trips', 'legacy')));
});

test('the exact passenger tracking query allows current members and excludes legacy route data', async () => {
  for (const uid of ['passenger', 'new-member']) {
    const db = environment.authenticatedContext(uid).firestore();
    const snapshot = await assertSucceeds(getDocs(passengerActiveTripQuery(db, 'tracking-community', 'driver', '2026-10-03')));
    assert.deepEqual(snapshot.docs.map((record) => record.id), ['tracking-active']);
    assert.deepEqual(snapshot.docs[0].data().driverLocation, driverLocation);
    assert.deepEqual(snapshot.docs[0].data().collectedPassengerIds, ['passenger']);
    await assertFails(getDoc(doc(db, 'trips', 'tracking-legacy')));
  }
  const stranger = environment.authenticatedContext('stranger').firestore();
  await assertFails(getDocs(passengerActiveTripQuery(stranger, 'tracking-community', 'driver', '2026-10-03')));
  const anonymous = environment.unauthenticatedContext().firestore();
  await assertFails(getDocs(passengerActiveTripQuery(anonymous, 'tracking-community', 'driver', '2026-10-03')));
});

test('leaving revokes active tracking but preserves historical summary access', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'communities', 'left-community'), { driverId: 'driver', memberIds: [] });
    await setDoc(doc(context.firestore(), 'trips', 'left-active'), trip({ communityId: 'left-community', status: 'active', endedAt: null }));
    await setDoc(doc(context.firestore(), 'trips', 'left-completed'), trip({ communityId: 'left-community' }));
  });
  const db = environment.authenticatedContext('passenger').firestore();
  await assertFails(getDoc(doc(db, 'trips', 'left-active')));
  await assertSucceeds(getDoc(doc(db, 'trips', 'left-completed')));
});

test('only the owning driver can publish a valid active GPS fix and completion deletes it', async () => {
  const db = environment.authenticatedContext('driver').firestore();
  const reference = doc(db, 'trips', 'active');
  await assertSucceeds(updateDoc(reference, { driverLocation }));
  await assertSucceeds(updateDoc(reference, { driverLocation: { ...driverLocation, heading: 120 } }));
  const passengerDb = environment.authenticatedContext('passenger').firestore();
  assert.deepEqual((await getDoc(doc(passengerDb, 'trips', 'active'))).data().driverLocation, { ...driverLocation, heading: 120 });
  for (const uid of ['passenger', 'other-driver']) {
    await assertFails(updateDoc(doc(environment.authenticatedContext(uid).firestore(), 'trips', 'active'), { driverLocation }));
  }
  await assertFails(updateDoc(reference, { driverLocation: { ...driverLocation, latitude: 91 } }));
  await assertFails(updateDoc(reference, { driverLocation: { ...driverLocation, longitude: -181 } }));
  await assertFails(updateDoc(reference, { driverLocation: { ...driverLocation, passengerName: 'Private Name' } }));
  const repository = createTripRepository(db);
  const active = await repository.get('active');
  active.route = await repository.getRoute('active');
  await completeTrip(repository, active, [], '2026-10-03T02:00:00Z');
  assert.equal('driverLocation' in (await getDoc(reference)).data(), false);
  await assertFails(updateDoc(reference, { driverLocation }));
});

test('absent members retain access through the saved membership snapshot', async () => {
  const db = environment.authenticatedContext('absent').firestore();
  await assertSucceeds(getDoc(doc(db, 'trips', 'completed')));
  await assertFails(getDoc(doc(db, 'trips', 'completed', 'private', 'route')));
});

test('anonymous users and unrelated drivers cannot read or write trip data', async () => {
  const anonymous = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anonymous, 'trips', 'completed')));
  await assertFails(setDoc(doc(anonymous, 'trips', 'new'), trip()));
  const otherDriver = environment.authenticatedContext('other-driver').firestore();
  await assertFails(getDoc(doc(otherDriver, 'trips', 'completed')));
  await assertFails(getDoc(doc(otherDriver, 'trips', 'completed', 'private', 'route')));
});

test('unbounded and old per-community passenger queries are denied', async () => {
  const db = environment.authenticatedContext('passenger').firestore();
  await assertFails(getDocs(query(collection(db, 'trips'), where('communityId', '==', 'community'), limit(50))));
  await assertFails(getDocs(query(collection(db, 'trips'), where('schemaVersion', '==', 2), where('participantIds', 'array-contains', 'passenger'), where('status', '==', 'completed'))));
});

test('driver creation and completion persist the public record and private route atomically', async () => {
  const repository = createTripRepository(environment.authenticatedContext('driver').firestore());
  const stored = await startOrResumeTrip(repository, {
    driverId: 'driver', communityId: 'community', date: '2026-10-04', shift: 'morning', stops,
  }, '2026-10-04T01:00:00Z');
  const completed = await completeTrip(repository, stored, [{
    stopId: 'stop', location: position, completedAt: '2026-10-04T02:00:00Z',
    pickedUp: [{ userId: 'passenger', name: 'Private Name' }], droppedOff: [],
  }], '2026-10-04T02:00:00Z');
  assert.equal(completed.data.summary.passengersCollected, 1);
  const publicRecord = await createTripRepository(environment.authenticatedContext('passenger').firestore()).get(stored.id);
  assert.doesNotMatch(JSON.stringify(publicRecord.data), /latitude|longitude|Private Name|pickupLocation/);
  assert.equal((await repository.getRoute(stored.id)).plannedStops[0].pickups[0].name, 'Private Name');
});

test('shared documents reject passenger objects and cannot change historical membership', async () => {
  const db = environment.authenticatedContext('driver').firestore();
  await assertFails(setDoc(doc(db, 'trips', 'unsafe'), trip({ plannedStops: stops })));
  await assertFails(setDoc(doc(db, 'trips', 'completed'), trip({ participantIds: ['new-member'] })));
});

test('resuming an older active trip moves its route into private storage and removes shared locations', async () => {
  const oldStart = '2026-10-05T01:00:00Z';
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'trips', 'legacy-active'), {
      driverId: 'driver', communityId: 'community', date: '2026-10-05', shift: 'morning', status: 'active',
      startedAt: oldStart, endedAt: null, plannedStops: stops, completedStops: [], driverLocation,
    });
  });
  const repository = createTripRepository(environment.authenticatedContext('driver').firestore());
  const resumed = await startOrResumeTrip(repository, {
    driverId: 'driver', communityId: 'community', date: '2026-10-05', shift: 'morning', stops,
  }, '2026-10-05T01:30:00Z');
  assert.equal(resumed.id, 'legacy-active');
  assert.equal(resumed.data.startedAt, oldStart);
  assert.deepEqual((await repository.getRoute(resumed.id)).plannedStops, stops);
  const shared = (await repository.get(resumed.id)).data;
  assert.deepEqual(shared.driverLocation, driverLocation);
  assert.doesNotMatch(JSON.stringify(shared), /Private Name|plannedStops|completedStops|pickupLocation/);
});
