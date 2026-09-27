import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  currentDriverShift, cutoffLabel, localDateKey, summarizeShift,
} from '../src/utils/driverAttendance.ts';

test('uses local date and switches shifts at noon', () => {
  assert.equal(localDateKey(new Date(2026, 8, 27, 11, 59)), '2026-09-27');
  assert.equal(currentDriverShift(new Date(2026, 8, 27, 11, 59)), 'morning');
  assert.equal(currentDriverShift(new Date(2026, 8, 27, 12, 0)), 'evening');
});

test('counts only confirmed members for the requested shift', () => {
  const members = [
    { userId: 'a', name: 'Asha Perera' },
    { userId: 'b', name: 'Bimal Silva' },
    { userId: 'c', name: 'Chamara Fernando' },
  ];
  const records = [
    { userId: 'a', shift: 'morning', status: 'present' },
    { userId: 'b', shift: 'morning', status: 'absent' },
    { userId: 'c', shift: 'evening', status: 'present' },
    { userId: 'outsider', shift: 'morning', status: 'present' },
  ];
  const morning = summarizeShift(members, records, 'morning');
  assert.deepEqual(morning.confirmed, [members[0]]);
  assert.equal(morning.total, 3);
  assert.equal(morning.percent, 33);
  assert.equal(morning.progressColor, '#EF4444');
  assert.deepEqual(summarizeShift(members, records, 'evening').confirmed, [members[2]]);
});

test('uses the exact colour thresholds and handles no members', () => {
  const members = Array.from({ length: 4 }, (_, index) => ({ userId: String(index), name: `Passenger ${index}` }));
  const records = members.slice(0, 3).map((member) => ({ userId: member.userId, shift: 'morning', status: 'present' }));
  assert.equal(summarizeShift(members, records, 'morning').progressColor, '#F59E0B');
  assert.equal(summarizeShift(members.slice(0, 3), records, 'morning').progressColor, '#16A34A');
  assert.equal(summarizeShift([], records, 'morning').progressColor, '#CBD5E1');
});

test('shows cutoff time before it passes and Closed at the cutoff', () => {
  assert.match(cutoffLabel(new Date(2026, 8, 27, 8, 59), '09:00'), /^Cutoff /);
  assert.equal(cutoffLabel(new Date(2026, 8, 27, 9, 0), '09:00'), 'Closed');
  assert.equal(cutoffLabel(new Date(2026, 8, 27, 8, 0), 'invalid'), 'Cutoff not set');
});
