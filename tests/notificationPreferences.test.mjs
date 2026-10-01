import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  NOTIFICATION_TYPES, typesForRole, resolvePreferences, isNotificationEnabled,
  preferenceFieldPath, saveToggle,
} from '../src/utils/notificationPreferences.ts';

test('shows each passenger notification type and none for roles without any', () => {
  assert.deepEqual(
    typesForRole('passenger').map((t) => t.key),
    ['attendanceReminder', 'tripStarted', 'driverApproaching'],
  );
  assert.deepEqual(typesForRole('driver'), []);
  assert.deepEqual(typesForRole(null), []);
  assert.equal(NOTIFICATION_TYPES.length, 3);
});

test('everything is on until the user switches it off', () => {
  const all = { attendanceReminder: true, tripStarted: true, driverApproaching: true };
  assert.deepEqual(resolvePreferences(undefined), all);
  assert.deepEqual(resolvePreferences(null), all);
  assert.deepEqual(resolvePreferences({}), all);
  assert.deepEqual(resolvePreferences('junk'), all);
});

test('keeps saved choices and ignores values that are not booleans', () => {
  assert.deepEqual(
    resolvePreferences({ tripStarted: false, driverApproaching: 'no', attendanceReminder: true }),
    { attendanceReminder: true, tripStarted: false, driverApproaching: true },
  );
});

test('a disabled type is reported as not to be sent, others still are', () => {
  const stored = { tripStarted: false };
  assert.equal(isNotificationEnabled(stored, 'tripStarted'), false);
  assert.equal(isNotificationEnabled(stored, 'driverApproaching'), true);
  assert.equal(isNotificationEnabled(undefined, 'tripStarted'), true);
});

test('each preference is saved to its own field so toggles never overwrite each other', () => {
  assert.equal(preferenceFieldPath('tripStarted'), 'notificationPreferences.tripStarted');
});

test('a successful save passes the right values through', async () => {
  const calls = [];
  const result = await saveToggle('u1', 'tripStarted', false, async (...args) => { calls.push(args); });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls, [['u1', 'tripStarted', false]]);
});

test('a failed save is reported, not thrown, so the screen can revert the toggle', async () => {
  const boom = new Error('offline');
  const result = await saveToggle('u1', 'tripStarted', true, async () => { throw boom; });
  assert.equal(result.ok, false);
  assert.equal(result.error, boom);
});
