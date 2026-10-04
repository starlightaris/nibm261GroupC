import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchLeg } from './useRouteDirections';
import { haversineDistance, type LatLng } from '../utils/routeOptimizer';

// ─── Throttle settings ────────────────────────────────────────────────────────
// The driver writes a location every ~5s, but every directions refresh is a
// billable Routes API call. We only refetch when the bus has both moved a
// meaningful distance AND a minimum time has passed since the last fetch.

export const REFETCH_MIN_MOVE_METERS = 200;
export const REFETCH_MIN_INTERVAL_MS = 30_000;
/** After a failed request, wait this long before trying again. */
export const REFETCH_AFTER_FAILURE_MS = 60_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type PassengerRouteStatus = 'idle' | 'loading' | 'ready' | 'failed';

export interface LastFetch {
  origin: LatLng;
  destKey: string;
  at: number;
  failed: boolean;
}

export interface UsePassengerRouteParams {
  /** Live bus position. */
  origin: LatLng | null;
  /** The passenger's pickup location. */
  destination: LatLng | null;
  /** Same Google key the driver screen uses. */
  apiKey: string;
  /** False when there's nothing to route (not live, or already picked up). */
  enabled: boolean;
}

export interface UsePassengerRouteResult {
  /** Points to draw. Empty when nothing should be drawn. */
  path: LatLng[];
  /** True when `path` is a straight bus -> pickup line because directions failed. */
  isFallback: boolean;
  status: PassengerRouteStatus;
}

// ─── Pure helper (exported so it can be unit tested) ─────────────────────────

export function shouldRefetchRoute(
  last: LastFetch | null,
  origin: LatLng,
  destKey: string,
  now: number
): boolean {
  if (!last || last.destKey !== destKey) return true;

  const elapsed = now - last.at;
  if (last.failed) return elapsed >= REFETCH_AFTER_FAILURE_MS;

  return (
    elapsed >= REFETCH_MIN_INTERVAL_MS &&
    haversineDistance(last.origin, origin) >= REFETCH_MIN_MOVE_METERS
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePassengerRoute({
  origin,
  destination,
  apiKey,
  enabled,
}: UsePassengerRouteParams): UsePassengerRouteResult {
  const [route, setRoute] = useState<LatLng[]>([]);
  const [status, setStatus] = useState<PassengerRouteStatus>('idle');

  const lastRef = useRef<LastFetch | null>(null);
  const inFlightRef = useRef(false);
  const genRef = useRef(0); // bumped on reset so stale responses are ignored
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const originLat = origin?.latitude;
  const originLng = origin?.longitude;
  const destKey = destination
    ? `${destination.latitude},${destination.longitude}`
    : null;

  useEffect(() => {
    // Nothing to route (trip not live, passenger picked up, no pickup set…)
    if (!enabled || !origin || !destination || !destKey) {
      genRef.current += 1;
      inFlightRef.current = false;
      lastRef.current = null;
      setRoute([]);
      setStatus('idle');
      return;
    }

    // No key configured: skip the request and use the straight-line fallback.
    if (!apiKey) {
      setStatus('failed');
      return;
    }

    if (inFlightRef.current) return;
    if (!shouldRefetchRoute(lastRef.current, origin, destKey, Date.now())) return;

    const gen = genRef.current;
    const requestOrigin: LatLng = { latitude: origin.latitude, longitude: origin.longitude };
    inFlightRef.current = true;
    setStatus((prev) => (prev === 'ready' ? 'ready' : 'loading'));

    fetchLeg(requestOrigin, destination, apiKey).then((leg) => {
      if (gen !== genRef.current) return; // reset while in flight; drop result
      inFlightRef.current = false;
      if (!mountedRef.current) return;

      if (leg && leg.polyline.length > 1) {
        lastRef.current = { origin: requestOrigin, destKey, at: Date.now(), failed: false };
        setRoute(leg.polyline);
        setStatus('ready');
      } else {
        lastRef.current = { origin: requestOrigin, destKey, at: Date.now(), failed: true };
        // Keep showing the last good route if we have one.
        setStatus((prev) => (prev === 'ready' ? 'ready' : 'failed'));
      }
    });
  }, [enabled, originLat, originLng, destKey, apiKey]);

  // Trim the fetched route to start at the bus, so the line "eats" itself as
  // the bus moves between refetches instead of trailing behind it.
  const path = useMemo<LatLng[]>(() => {
    if (!enabled || !origin || !destination) return [];

    if (status === 'ready' && route.length > 1) {
      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < route.length; i++) {
        const d = haversineDistance(origin, route[i]);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      return [origin, ...route.slice(nearest)];
    }

    if (status === 'failed') return [origin, destination];

    return [];
  }, [enabled, originLat, originLng, destKey, route, status]);

  return { path, isFallback: status === 'failed', status };
}