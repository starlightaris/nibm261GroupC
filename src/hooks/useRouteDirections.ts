import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { RouteStop } from '@hooks/useDriverRoute';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface DirectionStep {
  instruction: string;   // HTML-stripped turn instruction e.g. "Turn left onto Galle Rd"
  distance: string;      // e.g. "0.3 km"
  duration: string;      // e.g. "1 min"
}

export interface StopRoute {
  stop: RouteStop;
  polyline: LatLng[];        // decoded points for this leg
  steps: DirectionStep[];    // turn-by-turn for this leg
  etaSeconds: number;        // total duration in seconds
  etaLabel: string;          // human label e.g. "4 mins"
  distanceLabel: string;     // e.g. "1.2 km"
}

export interface UseRouteDirectionsResult {
  /** Decoded polyline for the full remaining route (all legs joined) */
  fullPolyline: LatLng[];
  /** Per-stop route data — index 0 = driver → nextStop */
  stopRoutes: StopRoute[];
  /** Convenience: first step instruction for the very next manoeuvre */
  nextInstruction: string | null;
  /** Convenience: ETA label to next stop */
  nextEta: string | null;
  driverLocation: LatLng | null;
  loading: boolean;
  error: string | null;
  /** Call after markPickedUp to re-fetch from new position */
  refresh: () => void;
}

// ─── Google Maps Directions API base URL ─────────────────────────────────────
// The API key is read from the Expo config at runtime via a Constants import.
// We avoid hardcoding it here — instead we accept it as a parameter so the
// hook is testable and the key stays in app.json / .env only.

const DIRECTIONS_BASE = 'https://maps.googleapis.com/maps/api/directions/json';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags from Google's instruction strings */
function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, '').trim();
}

/** Convert seconds to a human-readable label */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

/** Convert metres to a human-readable label */
function formatDistance(metres: number): string {
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/**
 * Decode a Google Maps encoded polyline string into LatLng array.
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

/**
 * Fetch one leg: origin → destination.
 * Returns null on network/API failure so the caller can handle gracefully.
 */
async function fetchLeg(
  origin: LatLng,
  destination: LatLng,
  apiKey: string
): Promise<{
  polyline: LatLng[];
  steps: DirectionStep[];
  etaSeconds: number;
  distanceMetres: number;
} | null> {
  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    mode: 'driving',
    key: apiKey,
  });

  const res = await fetch(`${DIRECTIONS_BASE}?${params.toString()}`);
  if (!res.ok) return null;

  const json = await res.json();
  if (json.status !== 'OK' || !json.routes?.length) return null;

  const leg = json.routes[0].legs[0];

  const steps: DirectionStep[] = (leg.steps ?? []).map((s: any) => ({
    instruction: stripHtml(s.html_instructions ?? ''),
    distance: s.distance?.text ?? '',
    duration: s.duration?.text ?? '',
  }));

  const polyline = decodePolyline(json.routes[0].overview_polyline.points);

  return {
    polyline,
    steps,
    etaSeconds: leg.duration?.value ?? 0,
    distanceMetres: leg.distance?.value ?? 0,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseRouteDirectionsParams {
  /** Remaining stops to route through — pass trip.remainingStops */
  remainingStops: RouteStop[];
  /** Google Maps API key — pass from Constants.expoConfig?.android?.config?.googleMaps?.apiKey */
  apiKey: string;
  /** Skip fetching when trip isn't active yet */
  enabled?: boolean;
}

export function useRouteDirections({
  remainingStops,
  apiKey,
  enabled = true,
}: UseRouteDirectionsParams): UseRouteDirectionsResult {
  const [fullPolyline, setFullPolyline] = useState<LatLng[]>([]);
  const [stopRoutes, setStopRoutes] = useState<StopRoute[]>([]);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  // Stable ref to avoid stale closures in the async fetch
  const stopsRef = useRef(remainingStops);
  stopsRef.current = remainingStops;

  const refresh = () => setRefreshToken((t) => t + 1);

  useEffect(() => {
    if (!enabled || remainingStops.length === 0 || !apiKey) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // 1. Get driver's current location
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
        setDriverLocation(origin);

        // 2. Build waypoints: driver → stop[0] → stop[1] → ...
        const waypoints: LatLng[] = [origin, ...stopsRef.current.map((s) => s.pickupLocation)];

        // 3. Fetch each leg concurrently
        const legPromises = waypoints.slice(0, -1).map((wp, i) =>
          fetchLeg(wp, waypoints[i + 1], apiKey)
        );
        const legs = await Promise.all(legPromises);

        if (cancelled) return;

        // 4. Build StopRoute[] — one entry per remaining stop
        const routes: StopRoute[] = [];
        const joined: LatLng[] = [];

        legs.forEach((leg, i) => {
          const stop = stopsRef.current[i];
          if (!leg || !stop) return;

          joined.push(...leg.polyline);

          routes.push({
            stop,
            polyline: leg.polyline,
            steps: leg.steps,
            etaSeconds: leg.etaSeconds,
            etaLabel: formatDuration(leg.etaSeconds),
            distanceLabel: formatDistance(leg.distanceMetres),
          });
        });

        setStopRoutes(routes);
        setFullPolyline(joined);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[useRouteDirections]', err);
          setError(err?.message ?? 'Failed to fetch directions.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => { cancelled = true; };
  }, [enabled, apiKey, refreshToken, remainingStops.length]);
  // remainingStops.length as dep: re-fetch whenever a stop is completed

  const nextRoute = stopRoutes[0] ?? null;

  return {
    fullPolyline,
    stopRoutes,
    nextInstruction: nextRoute?.steps[0]?.instruction ?? null,
    nextEta: nextRoute?.etaLabel ?? null,
    driverLocation,
    loading,
    error,
    refresh,
  };
}