import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickupLabel } from '../src/utils/memberLocation.ts';

test('shows the place name, not coordinates', () => {
  const label = pickupLabel({ address: 'Galle Face Green, Colombo', latitude: 6.9271, longitude: 79.8612 });
  assert.equal(label, 'Pickup: Galle Face Green, Colombo');
});

test('says not set yet when the member has no pickup location', () => {
  assert.equal(pickupLabel(null), 'Pickup: not set yet');
  assert.equal(pickupLabel(undefined), 'Pickup: not set yet');
});

test('does not fall back to coordinates when the address is missing or blank', () => {
  assert.equal(pickupLabel({ latitude: 6.9, longitude: 79.8 }), 'Pickup: address unavailable');
  assert.equal(pickupLabel({ address: '   ' }), 'Pickup: address unavailable');
});
