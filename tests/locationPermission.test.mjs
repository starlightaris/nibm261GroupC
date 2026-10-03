import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  toPermissionState, PRE_PERMISSION_COPY, DENIED_COPY,
} from '../src/utils/locationPermission.ts';

test('maps every OS permission response onto the right state', () => {
  assert.equal(toPermissionState({ status: 'undetermined', canAskAgain: true }), 'undetermined');
  assert.equal(toPermissionState({ status: 'granted', canAskAgain: true }), 'granted');
  assert.equal(toPermissionState({ status: 'denied', canAskAgain: true }), 'denied');
  assert.equal(toPermissionState({ status: 'denied', canAskAgain: false }), 'blocked');
});

test('a later answer replaces an earlier one (state is never assumed)', () => {
  const first = toPermissionState({ status: 'denied', canAskAgain: false });
  const afterSettingsChange = toPermissionState({ status: 'granted', canAskAgain: true });
  assert.equal(first, 'blocked');
  assert.equal(afterSettingsChange, 'granted');
});

test('pre-permission explanation matches the role', () => {
  assert.equal(
    PRE_PERMISSION_COPY.driver.body,
    'Your location is used to share your position with passengers during a trip.'
  );
  assert.equal(
    PRE_PERMISSION_COPY.passenger.body,
    'Your location helps you set your pickup and dropoff points accurately.'
  );
});

test('denied message explains what stops working, per role', () => {
  assert.match(DENIED_COPY.driver, /directions/);
  assert.match(DENIED_COPY.passenger, /map/);
  assert.notEqual(DENIED_COPY.driver, DENIED_COPY.passenger);
});

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test('only foreground location is ever requested', () => {
  const forbidden = /Background(Permissions|Location)|startLocationUpdatesAsync|startGeofencingAsync/;
  for (const file of sourceFiles('src')) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), forbidden, `${file} touches background location`);
  }
  const appJson = readFileSync('app.json', 'utf8');
  assert.doesNotMatch(appJson, /ACCESS_BACKGROUND_LOCATION|UIBackgroundModes/);
  assert.doesNotMatch(appJson, /isAndroidBackgroundLocationEnabled"\s*:\s*true/);
});

test('location hooks check permission and never prompt on their own', () => {
  for (const file of [
    'src/hooks/useDriverRoute.ts',
    'src/hooks/useRouteDirections.ts',
    'src/hooks/useWaypointPolyline.ts',
  ]) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, /getForegroundPermissionsAsync/, `${file} must check permission`);
    assert.doesNotMatch(src, /requestForegroundPermissionsAsync/, `${file} must not prompt`);
  }
});
