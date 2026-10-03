import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';
import { isPickedUp, secondsSince } from '../src/utils/tripProgress.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function harness(context) {
  const state = { community: {
    communityId: 'community', driverId: 'driver', member: { userId: 'passenger', pickupLocation: null },
  } };
  const listeners = [];
  const source = await readFile(new URL('../src/hooks/usePassengerTrack.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const dependencies = {
    react: React,
    'firebase/firestore': {
      onSnapshot(query, next, error) {
        const listener = { query, next, error, unsubscribed: false };
        listeners.push(listener);
        return () => { listener.unsubscribed = true; };
      },
    },
    '../../firebaseConfig': { db: {} },
    './usePassengerCommunity': { usePassengerCommunity: () => ({ community: state.community, loading: false, error: null }) },
    '../utils/eta': { estimateEta: () => null },
    '../utils/tripProgress': { isPickedUp, secondsSince },
    '@services/liveTripService': { passengerActiveTripQuery: (_db, ...args) => args },
  };
  const module = { exports: {} };
  new Function('require', 'exports', 'module', outputText)((name) => {
    assert.ok(name in dependencies, `Unexpected hook dependency: ${name}`);
    return dependencies[name];
  }, module.exports, module);
  context.mock.method(console, 'error', () => {});
  let result;
  function Probe() { result = module.exports.usePassengerTrack(); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(Probe)); });
  context.after(async () => { await act(async () => renderer.unmount()); });
  return {
    state, listeners,
    get result() { return result; },
    async rerender() { await act(async () => renderer.update(React.createElement(Probe))); },
    async snapshot(listener, data) {
      await act(async () => listener.next({ empty: !data, docs: data ? [{ id: 'active', data: () => data }] : [] }));
    },
  };
}

const driverLocation = { latitude: 6.9, longitude: 79.8, heading: null, updatedAt: new Date().toISOString() };

test('tracking shows pickup status from schema-v2 IDs with no private completion log', async (context) => {
  const hook = await harness(context);
  assert.deepEqual(hook.listeners[0].query.slice(0, 2), ['community', 'driver']);
  await hook.snapshot(hook.listeners[0], { driverLocation, collectedPassengerIds: ['passenger'] });
  assert.equal(hook.result.state, 'live');
  assert.equal(hook.result.pickedUp, true);
  assert.deepEqual(hook.result.driverLocation, driverLocation);
  await hook.snapshot(hook.listeners[0], null);
  assert.equal(hook.result.state, 'waiting');
  assert.equal(hook.result.driverLocation, null);
  assert.equal(hook.result.pickedUp, false);
});

test('switching communities clears the old GPS and ignores late snapshots and errors', async (context) => {
  const hook = await harness(context);
  const oldListener = hook.listeners[0];
  await hook.snapshot(oldListener, { driverLocation, collectedPassengerIds: [] });
  hook.state.community = { ...hook.state.community, communityId: 'other-community' };
  await hook.rerender();
  assert.equal(oldListener.unsubscribed, true);
  assert.equal(hook.result.driverLocation, null);
  assert.equal(hook.result.state, 'loading');
  assert.equal(hook.listeners[1].query[0], 'other-community');
  await hook.snapshot(oldListener, { driverLocation, collectedPassengerIds: ['passenger'] });
  await act(async () => oldListener.error(new Error('Old subscription failed')));
  assert.equal(hook.result.driverLocation, null);
  assert.equal(hook.result.error, null);
  await hook.snapshot(hook.listeners[1], { driverLocation, collectedPassengerIds: [] });
  assert.equal(hook.result.state, 'live');
  await act(async () => hook.listeners[1].error(new Error('permission-denied')));
  assert.equal(hook.result.state, 'error');
  assert.equal(hook.result.driverLocation, null);
});
