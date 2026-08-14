import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { fetchLeg, type LatLng } from './useRouteDirections';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseWaypointPolylineParams {
  /** Ordered stop locations to route through — driver's current position is prepended automatically */
  waypoints: LatLng[];
  apiKey: string;
  enabled?: boolean;
}

interface UseWaypointPolylineResult {
  /** Decoded, road-snapped polyline for driver → waypoint[0] → waypoint[1] → … */
  fullPolyline: LatLng[];
  loading: boolean;
  error: string | null;
}

// A cheap, stable signature so the effect only re-fetches when the actual
// ordered coordinates change (not on every render / new array identity).
function waypointsSignature(waypoints: LatLng[]): string {
  return waypoints.map((w) => `${w.latitude.toFixed(6)},${w.longitude.toFixed(6)}`).join('|');
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Generic sibling of useRouteDirections — fetches a single road-snapped
 * polyline through an arbitrary ordered list of waypoints (not tied to
 * RouteStop/pickupLocation). Used by the Route preview screen, where stops
 * are grouped pickup+dropoff entries rather than per-passenger pickups.
 */
export function useWaypointPolyline({
  waypoints,
  apiKey,
  enabled = true,
}: UseWaypointPolylineParams): UseWaypointPolylineResult {
  const [fullPolyline, setFullPolyline] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waypointsRef = useRef(waypoints);
  waypointsRef.current = waypoints;

  const signature = waypointsSignature(waypoints);

  useEffect(() => {
    if (!enabled || waypoints.length === 0 || !apiKey) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied. Enable it in Settings to get directions.');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (cancelled) return;

        const origin: LatLng = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        const chain: LatLng[] = [origin, ...waypointsRef.current];

        const legPromises = chain.slice(0, -1).map((wp, i) => fetchLeg(wp, chain[i + 1], apiKey));
        const legs = await Promise.all(legPromises);

        if (cancelled) return;

        const joined: LatLng[] = [];
        legs.forEach((leg) => {
          if (leg) joined.push(...leg.polyline);
        });

        setFullPolyline(joined);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[useWaypointPolyline]', err);
          setError(err?.message ?? 'Failed to fetch directions.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, apiKey, signature]);

  return { fullPolyline, loading, error };
}
