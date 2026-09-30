import type { RouteStop } from '../hooks/useDriverRoute';
import { haversineDistance, type LatLng } from './routeOptimizer';
import { STOP_CLUSTER_RADIUS_METERS, type RouteStopEntry } from './routeStopEntries';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * One physical stop on the active trip. A stop can be a pickup, a drop-off, or
 * both (e.g. someone gets off and someone else boards at the same place).
 */
export interface TripStop {
  id: string;
  location: LatLng;
  dropoffs: RouteStop[];
  pickups: RouteStop[];
}

export type TripStopKind = 'pickup' | 'dropoff' | 'both';

export interface QueueItem {
  key: string;
  /** Index of the TripStop this item belongs to */
  stopIndex: number;
  kind: 'pickup' | 'dropoff';
  passenger: RouteStop;
}

// ─── Builders ─────────────────────────────────────────────────────────────────

function stopId(pickups: RouteStop[], dropoffs: RouteStop[]): string {
  return [
    'p', ...pickups.map((p) => p.userId),
    'd', ...dropoffs.map((p) => p.userId),
  ].join('-');
}

/**
 * Turns the driver's ordered pickup/drop-off entries into trip stops. Entries
 * that sit next to each other in the order and within the cluster radius of
 * each other collapse into a single stop, so a drop-off and a pickup at the
 * same place become one "next stop". Only neighbours merge — merging entries
 * further apart would silently reorder the driver's route.
 */
export function buildTripStops(entries: RouteStopEntry[]): TripStop[] {
  const stops: TripStop[] = [];

  for (const entry of entries) {
    const last = stops[stops.length - 1];
    const target =
      last && haversineDistance(last.location, entry.location) <= STOP_CLUSTER_RADIUS_METERS
        ? last
        : null;

    const stop: TripStop = target ?? {
      id: '',
      location: entry.location,
      dropoffs: [],
      pickups: [],
    };

    if (entry.kind === 'pickup') stop.pickups.push(...entry.passengers);
    else stop.dropoffs.push(...entry.passengers);

    if (!target) stops.push(stop);
  }

  stops.forEach((s) => {
    s.id = stopId(s.pickups, s.dropoffs);
  });

  return stops;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function tripStopKind(stop: TripStop): TripStopKind {
  if (stop.pickups.length > 0 && stop.dropoffs.length > 0) return 'both';
  return stop.dropoffs.length > 0 ? 'dropoff' : 'pickup';
}

/**
 * Flattens stops into one queue item per passenger per action, in trip order.
 * Drop-offs come before pickups within a stop (people get off, then board).
 * A passenger appears twice: once for their pickup, once for their drop-off.
 */
export function buildQueueItems(stops: TripStop[]): QueueItem[] {
  return stops.flatMap((stop, stopIndex) => [
    ...stop.dropoffs.map((passenger): QueueItem => ({
      key: `${stop.id}-dropoff-${passenger.userId}`,
      stopIndex,
      kind: 'dropoff',
      passenger,
    })),
    ...stop.pickups.map((passenger): QueueItem => ({
      key: `${stop.id}-pickup-${passenger.userId}`,
      stopIndex,
      kind: 'pickup',
      passenger,
    })),
  ]);
}

export function countTripActions(stops: TripStop[]): { pickups: number; dropoffs: number } {
  return stops.reduce(
    (acc, s) => ({
      pickups: acc.pickups + s.pickups.length,
      dropoffs: acc.dropoffs + s.dropoffs.length,
    }),
    { pickups: 0, dropoffs: 0 }
  );
}
