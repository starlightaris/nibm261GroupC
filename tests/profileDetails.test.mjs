import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeProfileDetails,
  profileUpdateData,
  submitProfileDetails,
  validateProfileDetails,
} from '../src/utils/profileDetails.ts';

const valid = { firstName: '  Asha  ', lastName: '  De   Silva  ', phone: '+94 77-123-4567' };

test('validates required names and mobile number', () => {
  assert.deepEqual(validateProfileDetails({ firstName: ' ', lastName: '', phone: '123abc456789' }), {
    firstName: 'First name is required.',
    lastName: 'Last name is required.',
    phone: 'Enter a valid mobile number using 9 to 15 digits.',
  });
  assert.deepEqual(validateProfileDetails({ ...valid, firstName: 'a'.repeat(81) }), {
    firstName: 'First name must be 80 characters or fewer.',
  });
  assert.deepEqual(validateProfileDetails(valid), {});
});

test('normalizes names and builds an update without changing identity or role', () => {
  assert.deepEqual(normalizeProfileDetails(valid), {
    firstName: 'Asha', lastName: 'De Silva', phone: '+94 77-123-4567',
  });
  assert.deepEqual(profileUpdateData(valid, '2026-09-27T00:00:00.000Z'), {
    firstName: 'Asha', lastName: 'De Silva', phone: '+94 77-123-4567',
    name: 'Asha De Silva', updatedAt: '2026-09-27T00:00:00.000Z',
  });
});

test('invalid form does not write, valid form writes to the signed-in user', async () => {
  const writes = [];
  const write = async (uid, data) => { writes.push({ uid, data }); };
  const invalid = await submitProfileDetails('user-1', { ...valid, phone: '123' }, write);
  assert.equal(invalid.phone, 'Enter a valid mobile number using 9 to 15 digits.');
  assert.equal(writes.length, 0);

  assert.deepEqual(await submitProfileDetails('user-1', valid, write, '2026-09-27T00:00:00.000Z'), {});
  assert.deepEqual(writes, [{
    uid: 'user-1',
    data: profileUpdateData(valid, '2026-09-27T00:00:00.000Z'),
  }]);
});

test('write errors reach the form instead of reporting success', async () => {
  await assert.rejects(
    submitProfileDetails('user-1', valid, async () => { throw new Error('permission denied'); }),
    /permission denied/,
  );
});
