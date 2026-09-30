import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  profileUpdateData,
  submitProfileDetails,
  validateProfileDetails,
} from '../src/utils/profileDetails.ts';

const valid = { firstName: 'Asha', lastName: 'Silva', phone: '0771234567' };

test('requires names and a mobile number', () => {
  assert.deepEqual(validateProfileDetails({ firstName: ' ', lastName: '', phone: ' ' }), {
    firstName: 'First name is required.',
    lastName: 'Last name is required.',
    phone: 'Mobile number is required.',
  });
  assert.deepEqual(validateProfileDetails(valid), {});
});

test('names allow ASCII letters only, with no spaces or special characters', () => {
  for (const firstName of [' Asha', 'Asha ', 'A sha', 'A-sha', 'Asha1', 'Ésha']) {
    assert.equal(
      validateProfileDetails({ ...valid, firstName }).firstName,
      'First name must use letters A-Z only, with no spaces or symbols.',
    );
  }
  for (const lastName of ['De Silva', 'Silva!', 'Silva\n']) {
    assert.equal(
      validateProfileDetails({ ...valid, lastName }).lastName,
      'Last name must use letters A-Z only, with no spaces or symbols.',
    );
  }
  assert.deepEqual(validateProfileDetails({ ...valid, firstName: 'a'.repeat(81) }), {
    firstName: 'First name must be 80 characters or fewer.',
  });
  assert.deepEqual(validateProfileDetails({ ...valid, firstName: 'a'.repeat(80) }), {});
});

test('mobile number accepts exactly ten digits and no other characters', () => {
  for (const phone of ['123456789', '12345678901']) {
    assert.equal(validateProfileDetails({ ...valid, phone }).phone, 'Mobile number must be exactly 10 digits.');
  }
  for (const phone of ['077 1234567', '+94771234567', '077-1234567', '077123456a']) {
    assert.equal(validateProfileDetails({ ...valid, phone }).phone, 'Mobile number must use digits only.');
  }
  assert.deepEqual(validateProfileDetails({ ...valid, phone: '0000000000' }), {});
});

test('builds an update without changing identity or role', () => {
  assert.deepEqual(profileUpdateData(valid, '2026-09-27T00:00:00.000Z'), {
    firstName: 'Asha', lastName: 'Silva', phone: '0771234567',
    name: 'Asha Silva', updatedAt: '2026-09-27T00:00:00.000Z',
  });
});

test('invalid form does not write, valid form writes to the signed-in user', async () => {
  const writes = [];
  const write = async (uid, data) => { writes.push({ uid, data }); };
  const invalid = await submitProfileDetails('user-1', { ...valid, firstName: 'A sha', phone: '12345678901' }, write);
  assert.equal(invalid.firstName, 'First name must use letters A-Z only, with no spaces or symbols.');
  assert.equal(invalid.phone, 'Mobile number must be exactly 10 digits.');
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
