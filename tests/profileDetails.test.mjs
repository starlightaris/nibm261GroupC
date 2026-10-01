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

const valid = { name: 'Asha Silva', phone: '0771234567' };
const NAME_RULE = 'letters A-Z only, with single spaces between words';

test('requires a name and a mobile number', () => {
  assert.deepEqual(validateProfileDetails({ name: ' ', phone: ' ' }), {
    name: 'Name is required.',
    phone: 'Mobile number is required.',
  });
  assert.deepEqual(validateProfileDetails(valid), {});
});

test('full name allows ASCII letters and single spaces between words', () => {
  for (const name of ['A-sha Silva', 'Asha1 Silva', 'Ésha Silva', 'Asha_x Silva', "Asha O'Brien", 'Asha Silva!', 'Asha De_Silva']) {
    assert.equal(validateProfileDetails({ ...valid, name }).name, `Name must use ${NAME_RULE}.`);
  }
  for (const name of ['Asha De Silva', ' Asha Silva ', 'Asha   De   Silva', 'Asha Silva\n']) {
    assert.deepEqual(validateProfileDetails({ ...valid, name }), {});
  }
  assert.deepEqual(validateProfileDetails({ ...valid, name: `Asha ${'a'.repeat(76)}` }), {
    name: 'Name must be 80 characters or fewer.',
  });
  assert.deepEqual(validateProfileDetails({ ...valid, name: `Asha ${'a'.repeat(75)}` }), {});
});

test('full name uses the same rules as sign-up and does not require two words', () => {
  assert.equal(validateFullName(''), 'Name is required.');
  assert.equal(validateFullName('Asha'), undefined);
  assert.equal(validateFullName('Asha Silva3'), `Name must use ${NAME_RULE}.`);
  assert.equal(validateFullName('  Asha   De Silva '), undefined);
  assert.deepEqual(splitFullName('  Asha   De Silva '), { firstName: 'Asha', lastName: 'De_Silva' });
  assert.deepEqual(splitFullName('Asha'), { firstName: 'Asha', lastName: '' });
  for (const name of ['Asha', 'Asha Silva3', '']) {
    assert.equal(validateProfileDetails({ ...valid, name }).name, validateFullName(name));
  }
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
  assert.deepEqual(profileUpdateData({ ...valid, name: ' Mary  Ann   De Silva ' }, '2026-09-27T00:00:00.000Z'), {
    firstName: 'Mary', lastName: 'Ann_De_Silva', phone: '0771234567',
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
  const invalid = await submitProfileDetails('user-1', { ...valid, name: 'Asha1 Silva', phone: '12345678901' }, write);
  assert.equal(invalid.name, `Name must use ${NAME_RULE}.`);
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
