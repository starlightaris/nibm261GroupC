import type { RouteStop } from '../hooks/useDriverRoute';
import { haversineDistance, nearestNeighborOrderBy, type LatLng } from './routeOptimizer';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StopKind = 'pickup' | 'dropoff';

export interface RouteStopEntry {
  id: string;
  kind: StopKind;
  location: LatLng;
  /** >1 when riders share a physical stop (clustered by proximity) */
  passengers: RouteStop[];
}

// Stops within this radius of each other are treated as the same physical
// stop and collapsed into one row/marker with multiple passenger icons.
const STOP_CLUSTER_RADIUS_METERS = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Group {
  location: LatLng;
  passengers: RouteStop[];
}

/**
 * Walks `stops` in order, attaching each passenger's point to an existing
 * group within STOP_CLUSTER_RADIUS_METERS or starting a new one. Preserves
 * the input order for first-seen groups — so if `stops` already comes in
 * nearest-neighbor order, the resulting groups do too.
 */
function clusterByLocation(
  stops: RouteStop[],
  getLocation: (stop: RouteStop) => LatLng
): Group[] {
  const groups: Group[] = [];

  for (const stop of stops) {
    const point = getLocation(stop);
    const existing = groups.find((g) => haversineDistance(g.location, point) <= STOP_CLUSTER_RADIUS_METERS);
    if (existing) {
      existing.passengers.push(stop);
    } else {
      groups.push({ location: point, passengers: [stop] });
    }
  }

  return groups;
}

function entryId(kind: StopKind, group: Group): string {
  return `${kind}-${group.passengers.map((p) => p.userId).join('-')}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Builds the unified pickup+dropoff stop list for the Route screen from the
 * driver's present-only, pickup-nearest-neighbor-ordered `stops`. Pickups
 * come first (in that same order, just clustered), then dropoffs — ordered
 * as a nearest-neighbor chain continuing from the last pickup — so the list
 * (and the map preview built from it) reads as one continuous route: pick
 * everyone up, then drop everyone off.
 */
export function buildStopEntries(stops: RouteStop[]): RouteStopEntry[] {
  const pickupGroups = clusterByLocation(stops, (s) => s.pickupLocation);
  const dropoffGroupsRaw = clusterByLocation(stops, (s) => s.dropoffLocation);

  const dropoffOrigin: LatLng | undefined =
    pickupGroups[pickupGroups.length - 1]?.location;

  const dropoffGroups = dropoffOrigin
    ? nearestNeighborOrderBy(dropoffOrigin, dropoffGroupsRaw, (g) => g.location)
    : dropoffGroupsRaw;

  const pickupEntries: RouteStopEntry[] = pickupGroups.map((g) => ({
    id: entryId('pickup', g),
    kind: 'pickup',
    location: g.location,
    passengers: g.passengers,
  }));

  const dropoffEntries: RouteStopEntry[] = dropoffGroups.map((g) => ({
    id: entryId('dropoff', g),
    kind: 'dropoff',
    location: g.location,
    passengers: g.passengers,
  }));

  return [...pickupEntries, ...dropoffEntries];
}
