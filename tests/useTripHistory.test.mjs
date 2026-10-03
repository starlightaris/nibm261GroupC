import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function harness(context, mode = 'history') {
  const state = { user: { uid: 'driver', role: 'driver' }, authLoading: false, focused: true, tripId: 'first', historyRevision: 0 };
  const calls = [];
  const errors = [];
  let request = async () => mode === 'history' ? [{ id: 'first' }] : { id: state.tripId };
  const source = await readFile(new URL('../src/hooks/useTripHistory.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  // Run the real hook with React. Only native navigation/auth and persistence
  // are replaced, so focus cleanup and state transitions remain under test.
  const dependencies = {
    react: React,
    '@react-navigation/native': {
      useFocusEffect(callback) { React.useEffect(() => state.focused ? callback() : undefined, [state.focused, callback]); },
    },
    '@hooks/useAuth': { useAuth: () => ({ user: state.user, loading: state.authLoading }) },
    '@services/tripRepository': { tripRepository: {} },
    '@services/tripService': {
      getTripHistoryRevision: () => state.historyRevision,
      loadTripHistory: async (_repo, viewer) => { calls.push(viewer); return request(viewer); },
      loadTripSummary: async (_repo, id, viewer) => { calls.push({ ...viewer, id }); return request(viewer, id); },
    },
  };
  const module = { exports: {} };
  new Function('require', 'exports', 'module', outputText)((name) => {
    assert.ok(name in dependencies, `Unexpected hook dependency: ${name}`);
    return dependencies[name];
  }, module.exports, module);
  context.mock.method(console, 'error', (...args) => {
    if (String(args[0]).startsWith('react-test-renderer is deprecated.')) return;
    errors.push(args);
  });
  let result;
  function Probe() {
    result = mode === 'history' ? module.exports.useTripHistory() : module.exports.useTripSummary(state.tripId);
    return null;
  }
  let renderer;
  let revision = 0;
  await act(async () => { renderer = create(React.createElement(Probe, { revision })); });
  context.after(async () => { await act(async () => renderer.unmount()); });
  return {
    state, calls, errors,
    get result() { return result; },
    set request(value) { request = value; },
    async rerender() { await act(async () => renderer.update(React.createElement(Probe, { revision: ++revision }))); },
  };
}

test('history loads the signed-in role and settles its initial loading state', async (context) => {
  const hook = await harness(context);
  assert.deepEqual(hook.result.data, [{ id: 'first' }]);
  assert.equal(hook.result.loading, false);
  assert.equal(hook.result.refreshing, false);
  assert.deepEqual(hook.calls, [{ uid: 'driver', role: 'driver' }]);
});

test('pull-to-refresh keeps the list mounted while the new request is pending', async (context) => {
  const hook = await harness(context);
  let resolve;
  hook.request = () => new Promise((done) => { resolve = done; });
  await act(async () => hook.result.reload());
  assert.equal(hook.result.loading, false);
  assert.equal(hook.result.refreshing, true);
  assert.deepEqual(hook.result.data, [{ id: 'first' }]);
  await act(async () => resolve([{ id: 'newest' }]));
  assert.equal(hook.result.refreshing, false);
  assert.deepEqual(hook.result.data, [{ id: 'newest' }]);
});

test('a refresh failure keeps the records and logs the original permission error', async (context) => {
  const hook = await harness(context);
  const error = new Error('permission-denied');
  hook.request = async () => { throw error; };
  await act(async () => hook.result.reload());
  assert.deepEqual(hook.result.data, [{ id: 'first' }]);
  assert.equal(hook.result.loading, false);
  assert.equal(hook.result.refreshing, false);
  assert.match(hook.result.error, /try again/i);
  assert.deepEqual(hook.errors, [['[useTripHistory]', error]]);
});

test('returning from a summary does not refetch history, including after a refresh', async (context) => {
  const hook = await harness(context);
  await act(async () => hook.result.reload());
  assert.equal(hook.calls.length, 2);
  hook.state.focused = false;
  await hook.rerender();
  hook.state.focused = true;
  await hook.rerender();
  assert.equal(hook.calls.length, 2);
  assert.equal(hook.result.loading, false);
});

test('changing account clears the old records and discards its pending refresh', async (context) => {
  const hook = await harness(context);
  let resolveOld;
  hook.request = () => new Promise((done) => { resolveOld = done; });
  await act(async () => hook.result.reload());
  let resolveNew;
  hook.request = () => new Promise((done) => { resolveNew = done; });
  hook.state.user = { uid: 'passenger', role: 'passenger' };
  await hook.rerender();
  assert.equal(hook.result.data, null);
  assert.equal(hook.result.loading, true);
  await act(async () => resolveOld([{ id: 'old-account' }]));
  assert.equal(hook.result.data, null);
  await act(async () => resolveNew([{ id: 'own-trip' }]));
  assert.deepEqual(hook.result.data, [{ id: 'own-trip' }]);
});

test('reopening history after a local completion fetches the newly completed trip', async (context) => {
  const hook = await harness(context);
  hook.state.focused = false;
  await hook.rerender();
  hook.state.historyRevision += 1;
  hook.request = async () => [{ id: 'completed-now' }, { id: 'first' }];
  hook.state.focused = true;
  await hook.rerender();
  assert.equal(hook.calls.length, 2);
  assert.equal(hook.result.loading, false);
  assert.deepEqual(hook.result.data.map((trip) => trip.id), ['completed-now', 'first']);
});

test('a different summary ID cannot reuse the previous summary record', async (context) => {
  const hook = await harness(context, 'summary');
  hook.state.tripId = 'second';
  await hook.rerender();
  assert.equal(hook.result.data.id, 'second');
  assert.deepEqual(hook.calls.map((call) => call.id), ['first', 'second']);
});

test('initial request errors remain retryable and are logged', async (context) => {
  const hook = await harness(context);
  hook.state.user = { uid: 'other-driver', role: 'driver' };
  const error = new Error('offline');
  hook.request = async () => { throw error; };
  await hook.rerender();
  assert.equal(hook.result.data, null);
  assert.equal(hook.result.loading, false);
  assert.deepEqual(hook.errors, [['[useTripHistory]', error]]);
  hook.request = async () => [];
  await act(async () => hook.result.reload());
  assert.deepEqual(hook.result.data, []);
  assert.equal(hook.result.error, null);
});
