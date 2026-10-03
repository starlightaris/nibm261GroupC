import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { usePassengerCommunity, type PassengerCommunity } from './usePassengerCommunity';
import { estimateEta, type Eta } from '../utils/eta';
import { isPickedUp, secondsSince } from '../utils/tripProgress';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading: number | null;
  /** ISO string, exactly as written by useLiveLocation. */
  updatedAt: string | null;
}

/**
 * loading  – community or trip query still resolving
 * error    – something failed (see `error`)
 * no-community – passenger hasn't joined a community
 * waiting  – no active trip today: the driver hasn't started yet
 * locating – trip is active but the first GPS fix hasn't been written yet
 * live     – trip is active and driverLocation is available
 */
export type TrackState =
  | 'loading'
  | 'error'
  | 'no-community'
  | 'waiting'
  | 'locating'
  | 'live';

export interface UsePassengerTrackResult {
  state: TrackState;
  community: PassengerCommunity | null;
  driverLocation: DriverLocation | null;
  /** ETA to the passenger's own pickupLocation; null if it can't be computed. */
  eta: Eta | null;
  /** True once the driver has marked this passenger as picked up. */
  pickedUp: boolean;
  /** Seconds since the driver's last write; null if unknown. */
  secondsSinceUpdate: number | null;
  /** True when the last update is older than STALE_AFTER_SECONDS. */
  isStale: boolean;
  error: string | null;
}

interface ActiveTripSnapshot {
  tripId: string;
  driverLocation: DriverLocation | null;
  pickedUp: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Driver writes every ~5s; anything older than this is probably a dead feed. */
export const STALE_AFTER_SECONDS = 30;

const CLOCK_TICK_MS = 10_000;

function getTodayString(): string {
  // Same YYYY-MM-DD local-time format useActiveTrip writes to trips.date
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDriverLocation(raw: any): DriverLocation | null {
  if (!raw) return null;
  const { latitude, longitude, heading, updatedAt } = raw;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !isFinite(latitude) ||
    !isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    heading: typeof heading === 'number' && isFinite(heading) ? heading : null,
    updatedAt: typeof updatedAt === 'string' ? updatedAt : null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePassengerTrack(): UsePassengerTrackResult {
  const {
    community,
    loading: communityLoading,
    error: communityError,
  } = usePassengerCommunity();

  const driverId = community?.driverId ?? null;
  const uid = community?.member.userId ?? null;

  const [trip, setTrip] = useState<ActiveTripSnapshot | null>(null);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // ── Subscribe to today's active trip for this passenger's driver ───────────
  useEffect(() => {
    if (!driverId) {
      setTrip(null);
      setTripLoading(false);
      setTripError(null);
      return;
    }

    setTripLoading(true);
    setTripError(null);

    // All-equality filters -> no composite index needed.
    const tripQuery = query(
      collection(db, 'trips'),
      where('driverId', '==', driverId),
      where('date', '==', getTodayString()),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      tripQuery,
      (snap) => {
        if (snap.empty) {
          setTrip(null);
        } else {
          // Normally exactly one; if there are several, take the most recently started.
          const latest = snap.docs.reduce((a, b) =>
            (b.data().startedAt ?? '') > (a.data().startedAt ?? '') ? b : a
          );
          const data = latest.data();

          setTrip({
            tripId: latest.id,
            driverLocation: parseDriverLocation(data.driverLocation),
            pickedUp: isPickedUp(data.completedStops, uid),
          });
        }
        setTripError(null);
        setTripLoading(false);
      },
      (err) => {
        console.error('[usePassengerTrack]', err);
        setTripError(err?.message ?? 'Failed to load trip.');
        setTripLoading(false);
      }
    );

    return unsubscribe;
  }, [driverId, uid]);

  // ── Clock tick so the "stale" indicator updates between snapshots ──────────
  const activeTripId = trip?.tripId ?? null;
  useEffect(() => {
    if (!activeTripId) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [activeTripId]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const driverLocation = trip?.driverLocation ?? null;
  const pickedUp = trip?.pickedUp ?? false;
  const pickup = community?.member.pickupLocation ?? null;

  const secondsSinceUpdate = useMemo(
    () => secondsSince(driverLocation?.updatedAt, now),
    [driverLocation, now]
  );

  const isStale =
    secondsSinceUpdate !== null && secondsSinceUpdate > STALE_AFTER_SECONDS;

  const eta = useMemo<Eta | null>(() => {
    if (!driverLocation || !pickup || pickedUp) return null;
    return estimateEta(
      { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
      { latitude: pickup.latitude, longitude: pickup.longitude }
    );
  }, [driverLocation, pickup, pickedUp]);

  let state: TrackState;
  if (communityLoading) state = 'loading';
  else if (communityError) state = 'error';
  else if (!community) state = 'no-community';
  else if (tripLoading) state = 'loading';
  else if (tripError) state = 'error';
  else if (!trip) state = 'waiting';
  else if (!driverLocation) state = 'locating';
  else state = 'live';

  return {
    state,
    community,
    driverLocation,
    eta,
    pickedUp,
    secondsSinceUpdate,
    isStale,
    error: communityError ?? tripError,
  };
}
