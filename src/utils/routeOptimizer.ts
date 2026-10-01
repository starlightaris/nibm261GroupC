export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METRES = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two points, in metres. */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(h));
}

/**
 * Greedy nearest-neighbor ordering: repeatedly picks the closest remaining
 * stop's pickup location to the current position, starting from `origin`.
 */
export function nearestNeighborOrder<T extends { pickupLocation: LatLng }>(
  origin: LatLng,
  stops: T[]
): T[] {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(current, remaining[i].pickupLocation);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next.pickupLocation;
  }

  return ordered;
}

/**
 * Same greedy nearest-neighbor strategy as `nearestNeighborOrder`, but generic
 * over any location accessor — used for ordering stop groups that aren't
 * keyed by `pickupLocation` (e.g. dropoff clusters).
 */
export function nearestNeighborOrderBy<T>(
  origin: LatLng,
  items: T[],
  getLocation: (item: T) => LatLng
): T[] {
  const remaining = [...items];
  const ordered: T[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(current, getLocation(remaining[i]));
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = getLocation(next);
  }

  return ordered;
}
