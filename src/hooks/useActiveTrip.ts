import { useState, useCallback, useRef } from 'react';
import type { Shift } from '@hooks/useDriverRoute';
import type { TripStop } from '@utils/tripStops';
import type { CompletedStopLogEntry, StoredTrip, TripStatus } from '../types/trip';
import { startOrResumeTrip, completeTrip, tripProgress } from '@services/tripService';
import { tripRepository } from '@services/tripRepository';
import { auth } from '../../firebaseConfig';

export type { CompletedStopLogEntry, TripStatus } from '../types/trip';

export interface ActiveTripState {
  tripId: string | null;
  status: TripStatus;
  currentStopIndex: number;
  /** Stops remaining from the current index onward. */
  remainingStops: TripStop[];
  /** Stops already completed. */
  completedStops: TripStop[];
  /** The next stop the driver is heading to. */
  nextStop: TripStop | null;
  /** Original route, preserved when resuming a trip. */
  allStops: TripStop[];
}

export interface UseActiveTripResult {
  trip: ActiveTripState;
  loading: boolean;
  error: string | null;
  /** Creates or resumes the persisted trip when the screen opens. */
  startTrip: (params: StartTripParams) => Promise<void>;
  /** Saves pickups/drop-offs at the current stop, then advances. */
  completeStop: () => Promise<void>;
  /** Completes the trip early using the stops already saved. */
  endTrip: () => Promise<void>;
}

export interface StartTripParams {
  stops: TripStop[];
  shift: Shift;
  communityId: string;
}

function getTodayString(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildTripState(stops: TripStop[], index: number, tripId: string | null, status: TripStatus): ActiveTripState {
  return {
    tripId,
    status,
    currentStopIndex: index,
    allStops: stops,
    remainingStops: status === 'completed' ? [] : stops.slice(index),
    completedStops: stops.slice(0, index),
    nextStop: status === 'completed' ? null : stops[index] ?? null,
  };
}

const INITIAL_STATE = buildTripState([], 0, null, 'pending');

export function useActiveTrip(): UseActiveTripResult {
  const repository = tripRepository;
  const driverId = auth.currentUser?.uid ?? '';
  const [trip, setTrip] = useState<ActiveTripState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep callbacks aligned with the last successfully persisted trip state.
  const tripRef = useRef(trip);
  const documentRef = useRef<StoredTrip | null>(null);
  // Synchronous guard prevents duplicate taps before React renders loading.
  const busyRef = useRef(false);

  const publish = (next: ActiveTripState) => {
    tripRef.current = next;
    setTrip(next);
  };

  const startTrip = useCallback(async (params: StartTripParams) => {
    if (busyRef.current || documentRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const stored = await startOrResumeTrip(repository, {
        ...params,
        driverId,
        date: getTodayString(),
      });
      documentRef.current = stored;
      const stops = stored.route!.plannedStops;
      const log = stored.route!.completedStops;
      const index = Math.min(log.length, stops.length);
      // A legacy trip can have all stops saved without being marked completed.
      if (index === stops.length) {
        documentRef.current = await completeTrip(repository, stored, log);
        publish(buildTripState(stops, index, stored.id, 'completed'));
      } else {
        publish(buildTripState(stops, index, stored.id, 'active'));
      }
    } catch (err: unknown) {
      console.error('[useActiveTrip] startTrip:', err);
      documentRef.current = null;
      setError(err instanceof Error ? err.message : 'Failed to start trip.');
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [repository, driverId]);

  const completeStop = useCallback(async () => {
    const current = tripRef.current;
    const stored = documentRef.current;
    if (busyRef.current || !stored || !current.nextStop || current.status !== 'active') return;
    busyRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const stop = current.nextStop;
      const index = current.currentStopIndex + 1;
      const entry: CompletedStopLogEntry = {
        stopId: stop.id,
        completedAt: new Date().toISOString(),
        location: stop.location,
        pickedUp: stop.pickups.map(({ userId, name }) => ({ userId, name })),
        droppedOff: stop.dropoffs.map(({ userId, name }) => ({ userId, name })),
      };
      const log = [...stored.route!.completedStops, entry];
      const isLast = index >= current.allStops.length;
      if (isLast) {
        documentRef.current = await completeTrip(repository, stored, log, entry.completedAt);
      } else {
        const route = { ...stored.route!, completedStops: log };
        const progress = tripProgress(log);
        await repository.update(stored.id, progress, route);
        documentRef.current = {
          id: stored.id,
          data: { ...stored.data, ...progress },
          route,
        };
      }
      publish(buildTripState(current.allStops, index, stored.id, isLast ? 'completed' : 'active'));
    } catch (err: unknown) {
      console.error('[useActiveTrip] completeStop:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete stop.');
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [repository]);

  const endTrip = useCallback(async () => {
    const stored = documentRef.current;
    if (busyRef.current || !stored || stored.data.status !== 'active') return;
    busyRef.current = true;
    setLoading(true);
    setError(null);
    try {
      documentRef.current = await completeTrip(repository, stored, stored.route!.completedStops);
      const current = tripRef.current;
      publish(buildTripState(current.allStops, current.currentStopIndex, stored.id, 'completed'));
    } catch (err: unknown) {
      console.error('[useActiveTrip] endTrip:', err);
      setError(err instanceof Error ? err.message : 'Failed to end trip.');
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [repository]);

  return { trip, loading, error, startTrip, completeStop, endTrip };
}
