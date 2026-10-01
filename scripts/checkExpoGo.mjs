import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const expoCli = require.resolve('expo/bin/cli');
const sdkMajor = require('expo/package.json').version.split('.')[0];
const environment = { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' };

async function checkDependencies() {
  const check = spawn(process.execPath, [expoCli, 'install', '--check'], { env: environment, stdio: 'inherit' });
  const [code] = await once(check, 'exit');
  assert.equal(code, 0, 'Expo dependency compatibility check failed');
}

async function availablePort() {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

await checkDependencies();
const port = await availablePort();
const server = spawn(process.execPath, [expoCli, 'start', '--go', '--localhost', '--port', String(port), '--max-workers', '2'], {
  env: environment,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
for (const stream of [server.stdout, server.stderr]) {
  stream.on('data', (chunk) => { output = (output + chunk.toString()).slice(-16000); });
}
// Expo's localhost listener can bind IPv6 only on Windows.
const base = `http://localhost:${port}`;

try {
  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline && server.exitCode === null) {
    try {
      const response = await fetch(`${base}/status`, { signal: AbortSignal.timeout(3000) });
      if (response.ok && (await response.text()).includes('packager-status:running')) {
        ready = true;
        break;
      }
    } catch { /* Metro is still starting. */ }
    await delay(1000);
  }
  assert.ok(ready, 'Expo Go development server did not become ready');
  console.log('Expo Go Metro server: PASS');

  for (const platform of ['android', 'ios']) {
    const response = await fetch(base, {
      headers: { accept: 'application/expo+json', 'expo-platform': platform, 'expo-protocol-version': '0' },
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(response.status, 200, `${platform} Expo Go manifest failed`);
    const manifest = await response.json();
    assert.equal(manifest.extra?.expoClient?.sdkVersion?.split('.')[0], sdkMajor, `${platform} manifest SDK mismatch`);
    assert.ok(manifest.launchAsset?.url, `${platform} manifest has no launch asset`);
    const bundleUrl = new URL(manifest.launchAsset.url);
    assert.equal(bundleUrl.searchParams.get('platform'), platform);
    assert.equal(bundleUrl.searchParams.get('dev'), 'true', 'Expected the Expo Go development bundle');
    console.log(`${platform} Expo Go SDK ${sdkMajor} manifest: PASS`);

    // Request the manifest's launch path from the same localhost listener;
    // its advertised loopback IP may use IPv4 while Metro is bound to IPv6.
    const localBundleUrl = new URL(bundleUrl.pathname + bundleUrl.search, base);
    const bundle = await fetch(localBundleUrl, { signal: AbortSignal.timeout(180000) });
    assert.equal(bundle.status, 200, `${platform} development bundle failed`);
    const javascript = await bundle.text();
    assert.ok(javascript.length > 1000, `${platform} development bundle is empty`);
    assert.ok(javascript.includes('TripSummaryScreen'), `${platform} bundle is missing Trip Summary`);
    assert.ok(javascript.includes('TripHistoryScreen'), `${platform} bundle is missing Trip History`);
    console.log(`${platform} Expo Go development bundle (${Math.round(javascript.length / 1024)} KB): PASS`);
  }
  console.log('Automated Expo Go compatibility checks passed. Device interaction and live Firestore testing are separate checks.');
} catch (error) {
  // Only emit diagnostic lines, never a full manifest containing app config.
  const diagnostics = output.split(/\r?\n/).filter((line) => /error|failed|unable/i.test(line));
  for (const line of diagnostics.slice(-12)) console.error(line);
  console.error(error.message);
  if (error.cause?.message) console.error(error.cause.message);
  process.exitCode = 1;
} finally {
  if (process.platform === 'win32' && server.exitCode === null) {
    spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  } else if (server.exitCode === null) {
    server.kill('SIGTERM');
  }
}
