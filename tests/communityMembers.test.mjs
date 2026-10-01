import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withoutMember } from '../src/utils/communityMembers.ts';

const members = [
  { userId: 'a', name: 'A', pickupLocation: null },
  { userId: 'b', name: 'B', pickupLocation: null },
];

test('removes the member from both members and memberIds', () => {
  const result = withoutMember(members, ['a', 'b'], 'a');
  assert.deepEqual(result.members.map((m) => m.userId), ['b']);
  assert.deepEqual(result.memberIds, ['b']);
  assert.equal(result.wasMember, true);
});

test('reports wasMember false and changes nothing for a non-member', () => {
  const result = withoutMember(members, ['a', 'b'], 'z');
  assert.equal(result.members.length, 2);
  assert.deepEqual(result.memberIds, ['a', 'b']);
  assert.equal(result.wasMember, false);
});

test('cleans a stale memberIds entry even if members[] has no entry', () => {
  const result = withoutMember([], ['a'], 'a');
  assert.deepEqual(result.memberIds, []);
  assert.equal(result.wasMember, true);
});

test('tolerates missing fields', () => {
  const result = withoutMember(undefined, undefined, 'a');
  assert.deepEqual(result, { members: [], memberIds: [], wasMember: false });
});
