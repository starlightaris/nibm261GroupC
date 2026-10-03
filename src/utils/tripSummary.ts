import type { TripDocument, TripSummary, TripViewer } from '../types/trip';

export function tripTimestamp(value: unknown): string | null {
  try {
    const date = value instanceof Date ? value
      : typeof value === 'string' ? new Date(value)
      : value && typeof (value as { toDate?: unknown }).toDate === 'function'
        ? (value as { toDate: () => Date }).toDate()
        : value && typeof (value as { seconds?: unknown }).seconds === 'number'
          ? new Date((value as { seconds: number }).seconds * 1000)
          : null;
    return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
  } catch {
    return null;
  }
}

function recordedCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

export function buildTripSummary(id: string, trip: TripDocument): TripSummary {
  const log = trip.completedStops ?? [];
  const collectedIds = new Set(trip.collectedPassengerIds ?? log.flatMap((stop) => (stop.pickedUp ?? []).map((p) => p.userId)));
  const plannedIds = trip.plannedPassengerIds ? new Set(trip.plannedPassengerIds) : trip.plannedStops
    ? new Set(trip.plannedStops.flatMap((stop) => stop.pickups.map((p) => p.userId)))
    : null;
  const totalStopsPlanned = trip.plannedStopIds?.length ?? trip.plannedStops?.length ?? recordedCount(trip.totalStopsPlanned);
  const passengersPlanned = plannedIds?.size ?? recordedCount(trip.passengersPlanned);
  const passengersCollected = collectedIds.size;
  const passengersMissed = plannedIds
    ? [...plannedIds].filter((uid) => !collectedIds.has(uid)).length
    : passengersPlanned === null ? null : Math.max(0, passengersPlanned - passengersCollected);
  const startedAt = tripTimestamp(trip.startedAt);
  const endedAt = tripTimestamp(trip.endedAt);
  const elapsed = startedAt && endedAt ? Date.parse(endedAt) - Date.parse(startedAt) : null;

  return {
    id,
    date: trip.date,
    shift: trip.shift,
    startedAt,
    endedAt,
    totalStopsPlanned,
    stopsCompleted: new Set(trip.completedStopIds ?? log.map((stop) => stop.stopId)).size,
    passengersPlanned,
    passengersCollected,
    passengersMissed,
    durationSeconds: elapsed !== null && elapsed >= 0 ? Math.floor(elapsed / 1000) : null,
  };
}

export function canViewTrip(trip: TripDocument, viewer: TripViewer): boolean {
  if (trip.status !== 'completed') return false;
  if (viewer.role === 'driver') return trip.driverId === viewer.uid;
  // Older trip documents include locations/names. They cannot be safely
  // exposed to passengers because Firestore reads return entire documents.
  return trip.schemaVersion === 2 && (trip.participantIds ?? []).includes(viewer.uid);
}

export function sortTripSummaries(trips: TripSummary[]): TripSummary[] {
  return [...trips].sort((a, b) =>
    (Date.parse(b.endedAt ?? '') || 0) - (Date.parse(a.endedAt ?? '') || 0)
    || b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );
}

export function formatTripDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Date not recorded';
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isFinite(parsed.getTime())
    ? parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Date not recorded';
}

export function formatTripTime(value: string | null): string {
  return value ? new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Not recorded';
}

export function formatTripDuration(seconds: number | null): string {
  if (seconds === null) return 'Not recorded';
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}
