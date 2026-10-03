import type {
  CompletedStopLogEntry,
  PrivateTripRoute,
  StoredTrip,
  TripDocument,
  TripShift,
  TripSummary,
  TripViewer,
} from '../types/trip';
import type { TripStop } from '@utils/tripStops';
import { buildTripSummary, canViewTrip, sortTripSummaries } from '@utils/tripSummary';

export interface TripRepository {
  findActive: (driverId: string, date: string, shift: TripShift) => Promise<StoredTrip | null>;
  community: (id: string) => Promise<{ driverId: string; memberIds: string[] }>;
  create: (data: TripDocument, route: PrivateTripRoute) => Promise<string>;
  update: (id: string, data: Partial<TripDocument>, route?: PrivateTripRoute) => Promise<void>;
  getRoute: (id: string) => Promise<PrivateTripRoute | null>;
  get: (id: string) => Promise<StoredTrip | null>;
  byDriver: (uid: string) => Promise<StoredTrip[]>;
  byParticipant: (uid: string) => Promise<StoredTrip[]>;
}

let historyRevision = 0;

/** A completed trip must appear when a mounted history screen is reopened. */
export function getTripHistoryRevision(): number {
  return historyRevision;
}

/** IDs and aggregate counts are the only route data shared with passengers. */
export function tripProgress(log: CompletedStopLogEntry[]) {
  return {
    completedStopIds: [...new Set(log.map((stop) => stop.stopId))],
    collectedPassengerIds: [...new Set(log.flatMap((stop) => stop.pickedUp.map((person) => person.userId)))],
  };
}

export async function startOrResumeTrip(
  repository: TripRepository,
  params: { driverId: string; communityId: string; shift: TripShift; date: string; stops: TripStop[] },
  startedAt = new Date().toISOString(),
): Promise<StoredTrip> {
  if (!params.driverId) throw new Error('Not authenticated.');
  if (!params.stops.length) throw new Error('No active stops to start a trip.');

  const existing = await repository.findActive(params.driverId, params.date, params.shift);
  if (existing && existing.data.communityId !== params.communityId) {
    throw new Error('Finish the active trip before changing community.');
  }

  let route: PrivateTripRoute;
  let participantIds: string[];
  if (existing) {
    const savedRoute = await repository.getRoute(existing.id);
    if (existing.data.schemaVersion === 2 && !savedRoute) {
      throw new Error('The saved driver route is unavailable. Please try again.');
    }
    // Preserve the original route, log and membership on resume. Older active
    // records are moved to the private route document during this save.
    route = savedRoute ?? {
      plannedStops: existing.data.plannedStops ?? params.stops,
      completedStops: existing.data.completedStops ?? [],
    };
    participantIds = existing.data.participantIds ?? [];
  } else {
    const community = await repository.community(params.communityId);
    if (community.driverId !== params.driverId) throw new Error('This community belongs to another driver.');
    route = { plannedStops: params.stops, completedStops: [] };
    participantIds = community.memberIds;
  }

  const passengerIds = [...new Set(route.plannedStops.flatMap((stop) => stop.pickups.map((person) => person.userId)))];
  const data: TripDocument = {
    schemaVersion: 2,
    driverId: params.driverId,
    communityId: params.communityId,
    shift: params.shift,
    date: params.date,
    status: 'active',
    startedAt: existing?.data.startedAt ?? startedAt,
    endedAt: null,
    plannedStopIds: route.plannedStops.map((stop) => stop.id),
    plannedPassengerIds: passengerIds,
    participantIds: [...new Set([...participantIds, ...passengerIds])],
    totalStopsPlanned: route.plannedStops.length,
    passengersPlanned: passengerIds.length,
    ...tripProgress(route.completedStops),
  };

  if (existing) {
    await repository.update(existing.id, data, route);
    return { id: existing.id, data, route };
  }
  return { id: await repository.create(data, route), data, route };
}

export async function completeTrip(
  repository: TripRepository,
  trip: StoredTrip,
  log: CompletedStopLogEntry[],
  endedAt = new Date().toISOString(),
): Promise<StoredTrip> {
  if (trip.data.status === 'completed') return trip;
  const data: TripDocument = {
    ...trip.data,
    ...tripProgress(log),
    status: 'completed',
    endedAt,
  };
  const route = trip.route ? { ...trip.route, completedStops: log } : undefined;
  const { id: _id, date: _date, shift: _shift, startedAt: _start, endedAt: _end, ...summary } = buildTripSummary(trip.id, data);
  data.summary = summary;
  // Publish completion and its totals only with the saved private stop log.
  await repository.update(trip.id, {
    ...tripProgress(log), status: 'completed', endedAt, summary,
  }, route);
  historyRevision += 1;
  return { id: trip.id, data, route };
}

export async function loadTripHistory(repository: TripRepository, viewer: TripViewer): Promise<TripSummary[]> {
  // Passenger reads use only the safe shared schema. The previous per-community
  // fallback could expose legacy passenger locations and fail the whole screen.
  const records = viewer.role === 'driver'
    ? await repository.byDriver(viewer.uid)
    : await repository.byParticipant(viewer.uid);
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
