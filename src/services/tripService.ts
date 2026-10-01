import type { CompletedStopLogEntry, StoredTrip, TripDocument, TripShift, TripSummary, TripViewer } from '../types/trip';
import type { TripStop } from '../utils/tripStops';
import { buildTripSummary, canViewTrip, sortTripSummaries } from '../utils/tripSummary';

/** The Firestore adapter is separate so persistence and failures can be tested. */
export interface TripRepository {
  findActive: (driverId: string, date: string, shift: TripShift) => Promise<StoredTrip | null>;
  community: (id: string) => Promise<{ driverId: string; memberIds: string[] }>;
  create: (data: TripDocument) => Promise<string>;
  update: (id: string, data: Partial<TripDocument>) => Promise<void>;
  get: (id: string) => Promise<StoredTrip | null>;
  byDriver: (uid: string) => Promise<StoredTrip[]>;
  byParticipant: (uid: string) => Promise<StoredTrip[]>;
  legacyByPassenger: (uid: string) => Promise<StoredTrip[]>;
}

export async function startOrResumeTrip(
  repository: TripRepository,
  params: { driverId: string; communityId: string; shift: TripShift; date: string; stops: TripStop[] },
  startedAt = new Date().toISOString(),
): Promise<StoredTrip> {
  if (!params.driverId) throw new Error('Not authenticated.');
  if (!params.stops.length) throw new Error('No active stops to start a trip.');
  const existing = await repository.findActive(params.driverId, params.date, params.shift);
  if (existing) {
    if (existing.data.communityId !== params.communityId) throw new Error('Finish the active trip before changing community.');
    // Keep the original route, start time and membership when resuming.
    const data = { ...existing.data, status: 'active' as const };
    await repository.update(existing.id, { status: 'active' });
    return { id: existing.id, data };
  }
  const community = await repository.community(params.communityId);
  if (community.driverId !== params.driverId) throw new Error('This community belongs to another driver.');
  const plannedIds = params.stops.flatMap((stop) => stop.pickups.map((p) => p.userId));
  const data: TripDocument = {
    driverId: params.driverId,
    communityId: params.communityId,
    shift: params.shift,
    date: params.date,
    status: 'active',
    startedAt,
    endedAt: null,
    completedStops: [],
    plannedStops: params.stops,
    participantIds: [...new Set([...community.memberIds, ...plannedIds])],
    totalStopsPlanned: params.stops.length,
    passengersPlanned: new Set(plannedIds).size,
  };
  return { id: await repository.create(data), data };
}

export async function completeTrip(
  repository: TripRepository,
  trip: StoredTrip,
  log: CompletedStopLogEntry[],
  endedAt = new Date().toISOString(),
): Promise<StoredTrip> {
  if (trip.data.status === 'completed') return trip;
  const data: TripDocument = { ...trip.data, completedStops: log, status: 'completed', endedAt };
  const { id: _id, date: _date, shift: _shift, startedAt: _start, endedAt: _end, ...summary } = buildTripSummary(trip.id, data);
  data.summary = summary;
  // One write: a completed document can never exist without its saved totals.
  await repository.update(trip.id, { status: 'completed', endedAt, completedStops: log, summary });
  return { id: trip.id, data };
}

export async function loadTripHistory(repository: TripRepository, viewer: TripViewer): Promise<TripSummary[]> {
  const records = viewer.role === 'driver'
    ? await repository.byDriver(viewer.uid)
    : (await Promise.all([repository.byParticipant(viewer.uid), repository.legacyByPassenger(viewer.uid)])).flat();
  const unique = new Map(records.map((trip) => [trip.id, trip]));
  return sortTripSummaries([...unique.values()]
    .filter((trip) => canViewTrip(trip.data, viewer))
    .map((trip) => buildTripSummary(trip.id, trip.data)));
}

export async function loadTripSummary(repository: TripRepository, id: string, viewer: TripViewer): Promise<TripSummary> {
  const trip = await repository.get(id);
  if (!trip || !canViewTrip(trip.data, viewer)) throw new Error('This completed trip is not available for your account.');
  return buildTripSummary(trip.id, trip.data);
}
