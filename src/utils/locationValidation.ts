/**
 * Validates a pickup/drop-off candidate before it's written to Firestore.
 * Pure function, no side effects — kept separate from useUpdateLocation so
 * it can be unit tested on its own and reused anywhere else a location
 * selection needs checking (e.g. a future driver-side stop editor).
 */

export interface LocationCandidate {
  address: string;
  latitude: number;
  longitude: number;
}

// Rough bounding box for Sri Lanka. Generous enough to include the whole
// island plus a small margin, but tight enough to catch "the map got
// panned out to another country/the ocean" mistakes.
export const SERVICEABLE_AREA_BOUNDS = {
  minLatitude: 5.9,
  maxLatitude: 9.9,
  minLongitude: 79.5,
  maxLongitude: 81.9,
};

// Addresses MapPicker falls back to display when a reverse-geocode hasn't
// resolved yet or has failed. A selection carrying one of these isn't a
// real place, even if it slips through with numeric coordinates attached.
const UNRESOLVED_ADDRESS_MARKERS = [
  'dragging map to pick...',
  'unknown location',
  'error fetching address',
];

export function isWithinServiceableArea(latitude: number, longitude: number): boolean {
  return (
    latitude >= SERVICEABLE_AREA_BOUNDS.minLatitude &&
    latitude <= SERVICEABLE_AREA_BOUNDS.maxLatitude &&
    longitude >= SERVICEABLE_AREA_BOUNDS.minLongitude &&
    longitude <= SERVICEABLE_AREA_BOUNDS.maxLongitude
  );
}

/**
 * Returns an error message if the candidate location shouldn't be saved,
 * or null if it's good to go.
 */
export function validateLocationSelection(location: LocationCandidate): string | null {
  const address = location.address?.trim() ?? '';

  if (!address || UNRESOLVED_ADDRESS_MARKERS.includes(address.toLowerCase())) {
    return 'This location could not be resolved to an address. Try adjusting the pin slightly.';
  }

  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    return 'Invalid coordinates selected. Please try again.';
  }

  if (!isWithinServiceableArea(location.latitude, location.longitude)) {
    return 'This location is outside our serviceable area. Please choose a point within Sri Lanka.';
  }

  return null;
}