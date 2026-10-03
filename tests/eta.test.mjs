import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARRIVED_THRESHOLD_METERS,
  estimateEta,
  formatDistance,
  formatEta,
} from '../src/utils/eta.ts';

const here = { latitude: 6.9271, longitude: 79.8612 };
// ~0.009 degrees of latitude is roughly 1 km
const oneKmNorth = { latitude: 6.9361, longitude: 79.8612 };

test('says arriving now within the arrival threshold', () => {
  const near = { latitude: here.latitude + 0.0002, longitude: here.longitude };
  const eta = estimateEta(here, near);
  assert.ok(eta.distanceMeters <= ARRIVED_THRESHOLD_METERS);
  assert.equal(eta.minutes, 0);
});

test('rounds up to at least one minute outside the threshold', () => {
  const eta = estimateEta(here, { latitude: here.latitude + 0.001, longitude: here.longitude });
  assert.ok(eta.distanceMeters > ARRIVED_THRESHOLD_METERS);
  assert.equal(eta.minutes, 1);
});

test('inflates straight-line distance for roads and uses the given speed', () => {
  const slow = estimateEta(here, oneKmNorth, 10);
  const fast = estimateEta(here, oneKmNorth, 50);
  assert.ok(slow.minutes > fast.minutes);
  // ~1 km * 1.3 at 25 km/h is about 3.1 minutes -> 4
  assert.equal(estimateEta(here, oneKmNorth).minutes, 4);
});

test('formats ETA text', () => {
  assert.equal(formatEta(0), 'Arriving now');
  assert.equal(formatEta(7), '7 min');
  assert.equal(formatEta(60), '1 h');
  assert.equal(formatEta(75), '1 h 15 min');
});

test('formats distance text', () => {
  assert.equal(formatDistance(432), '430 m');
  assert.equal(formatDistance(1500), '1.5 km');
});
