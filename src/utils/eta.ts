import { haversineDistance, type LatLng } from './routeOptimizer';

/**
 * Rough average bus speed in city traffic. Tune this if ETAs feel off in testing.
 */
export const AVERAGE_SPEED_KMH = 25;

/**
 * Straight-line (haversine) distance is shorter than the real road distance,
 * so inflate it a little to avoid ETAs that are consistently too optimistic.
 */
export const ROAD_DISTANCE_FACTOR = 1.3;

/** Within this many metres of the pickup point we call it "arriving now". */
export const ARRIVED_THRESHOLD_METERS = 50;

export interface Eta {
  /** Straight-line distance in metres (not inflated). */
  distanceMeters: number;
  /** Whole minutes, 0 when the driver is within ARRIVED_THRESHOLD_METERS. */
  minutes: number;
}

export function estimateEta(
  from: LatLng,
  to: LatLng,
  speedKmh: number = AVERAGE_SPEED_KMH
): Eta {
  const distanceMeters = haversineDistance(from, to);

  if (distanceMeters <= ARRIVED_THRESHOLD_METERS) {
    return { distanceMeters, minutes: 0 };
  }

  const metersPerMinute = (speedKmh * 1000) / 60;
  const minutes = Math.max(
    1,
    Math.ceil((distanceMeters * ROAD_DISTANCE_FACTOR) / metersPerMinute)
  );

  return { distanceMeters, minutes };
}

export function formatEta(minutes: number): string {
  if (minutes <= 0) return 'Arriving now';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}