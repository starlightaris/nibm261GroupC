import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  fromStoredName,
  isValidPhone,
  profileUpdateData,
  splitFullName,
  submitProfileDetails,
  toStoredName,
  validateFullName,
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

const NAME_RULE = 'letters A-Z only, with single spaces between words';

test('names allow ASCII letters and single spaces between words', () => {
  for (const firstName of ['A-sha', 'Asha1', 'Ésha', 'Asha_x', "O'Brien"]) {
    assert.equal(validateProfileDetails({ ...valid, firstName }).firstName, `First name must use ${NAME_RULE}.`);
  }
  for (const lastName of ['Silva!', 'De_Silva']) {
    assert.equal(validateProfileDetails({ ...valid, lastName }).lastName, `Last name must use ${NAME_RULE}.`);
  }
  for (const lastName of ['De Silva', ' Silva ', 'De   Silva', 'Silva\n']) {
    assert.deepEqual(validateProfileDetails({ ...valid, lastName }), {});
  }
  assert.deepEqual(validateProfileDetails({ ...valid, firstName: 'a'.repeat(81) }), {
    firstName: 'First name must be 80 characters or fewer.',
  });
  assert.deepEqual(validateProfileDetails({ ...valid, firstName: 'a'.repeat(80) }), {});
});

test('full name (sign-up) needs a first and last name', () => {
  assert.equal(validateFullName(''), 'Name is required.');
  assert.equal(validateFullName('Asha'), 'Enter your first and last name.');
  assert.equal(validateFullName('Asha Silva3'), `Name must use ${NAME_RULE}.`);
  assert.equal(validateFullName('  Asha   De Silva '), undefined);
  assert.deepEqual(splitFullName('  Asha   De Silva '), { firstName: 'Asha', lastName: 'De_Silva' });
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

test('stored names use underscores and show back with spaces', () => {
  assert.equal(toStoredName(' De   Silva '), 'De_Silva');
  assert.equal(fromStoredName('De_Silva'), 'De Silva');
  assert.equal(isValidPhone('0771234567'), true);
  assert.equal(isValidPhone('077 123 4567'), false);
  assert.deepEqual(profileUpdateData({ ...valid, firstName: 'Mary  Ann', lastName: 'De Silva' }, '2026-09-27T00:00:00.000Z'), {
    firstName: 'Mary_Ann', lastName: 'De_Silva', phone: '0771234567',
    name: 'Mary Ann De Silva', updatedAt: '2026-09-27T00:00:00.000Z',
  });
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
  const invalid = await submitProfileDetails('user-1', { ...valid, firstName: 'Asha1', phone: '12345678901' }, write);
  assert.equal(invalid.firstName, `First name must use ${NAME_RULE}.`);
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
