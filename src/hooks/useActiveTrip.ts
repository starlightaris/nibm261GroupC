import { useState, useCallback, useRef } from 'react';
import {collection, doc, addDoc, updateDoc, query, where, getDocs,} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { RouteStop, Shift } from '@hooks/useDriverRoute';
import type { TripStop } from '@utils/tripStops';

// Types

export type TripStatus = 'pending' | 'active' | 'completed';

export interface ActiveTripState {
  tripId: string | null;
  status: TripStatus;
  currentStopIndex: number;
  /** Stops remaining (from currentStopIndex onward) */
  remainingStops: TripStop[];
  /** Stops already completed */
  completedStops: TripStop[];
  /** The next stop the driver is heading to */
  nextStop: TripStop | null;
  /** All stops passed in from Route screen */
  allStops: TripStop[];
}

/** One completed stop, as stored in trips/{id}.completedStops */
export interface CompletedStopLogEntry {
  stopId: string;
  completedAt: string;
  location: { latitude: number; longitude: number };
  droppedOff: { userId: string; name: string }[];
  pickedUp: { userId: string; name: string }[];
}

export interface UseActiveTripResult {
  trip: ActiveTripState;
  loading: boolean;
  error: string | null;
  /** Call once when the trip screen opens — creates (or resumes) the trips/ doc */
  startTrip: (params: StartTripParams) => Promise<void>;
  /** Complete the current stop (drop-offs and pickups there) and advance */
  completeStop: () => Promise<void>;
  /** End the trip early */
  endTrip: () => Promise<void>;
}

export interface StartTripParams {
  stops: TripStop[];
  shift: Shift;
  communityId: string;
}

// Helpers

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildTripState(
  stops: TripStop[],
  currentIndex: number,
  tripId: string | null,
  status: TripStatus
): ActiveTripState {
  return {
    tripId,
    status,
    currentStopIndex: currentIndex,
    allStops: stops,
    remainingStops: stops.slice(currentIndex),
    completedStops: stops.slice(0, currentIndex),
    nextStop: stops[currentIndex] ?? null,
  };
}

function toPerson(p: RouteStop) {
  return { userId: p.userId, name: p.name };
}

const INITIAL_STATE: ActiveTripState = {
  tripId: null,
  status: 'pending',
  currentStopIndex: 0,
  allStops: [],
  remainingStops: [],
  completedStops: [],
  nextStop: null,
};

// Hook

export function useActiveTrip(): UseActiveTripResult {
  const [trip, setTrip] = useState<ActiveTripState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable ref to mutable trip state for use inside callbacks
  // without stale-closure issues
  const tripRef = useRef(trip);
  tripRef.current = trip;

  // Mirror of trips/{id}.completedStops. Appended to locally and written back
  // whole, so earlier entries (and their timestamps) are never overwritten.
  const logRef = useRef<CompletedStopLogEntry[]>([]);

  // startTrip

  const startTrip = useCallback(async ({ stops, shift, communityId }: StartTripParams) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('Not authenticated.');
      return;
    }
    if (stops.length === 0) {
      setError('No active stops to start a trip.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const today = getTodayString();

      // Guard: don't create a duplicate active trip for today's shift
      const existingQuery = query(
        collection(db, 'trips'),
        where('driverId', '==', uid),
        where('date', '==', today),
        where('shift', '==', shift),
        where('status', 'in', ['pending', 'active'])
      );
      const existingSnap = await getDocs(existingQuery);

      let tripId: string;

      if (!existingSnap.empty) {
        // Resume existing trip doc rather than creating a duplicate
        const existingDoc = existingSnap.docs[0];
        tripId = existingDoc.id;
        const existingData = existingDoc.data();
        const log: CompletedStopLogEntry[] = existingData.completedStops ?? [];
        const resumeIndex = Math.min(log.length, stops.length);

        logRef.current = log;
        await updateDoc(doc(db, 'trips', tripId), { status: 'active' });

        setTrip(buildTripState(stops, resumeIndex, tripId, 'active'));
      } else {
        // Create a fresh trip document
        const tripDoc = await addDoc(collection(db, 'trips'), {
          driverId: uid,
          communityId,
          shift,
          date: today,
          status: 'active',
          startedAt: new Date().toISOString(),
          endedAt: null,
          completedStops: [], // appended to as each stop is completed
        });
        tripId = tripDoc.id;

        logRef.current = [];
        setTrip(buildTripState(stops, 0, tripId, 'active'));
      }
    } catch (err: any) {
      console.error('[useActiveTrip] startTrip:', err);
      setError(err?.message ?? 'Failed to start trip.');
    } finally {
      setLoading(false);
    }
  }, []);

  // completeStop

  const completeStop = useCallback(async () => {
    const current = tripRef.current;
    if (!current.tripId || !current.nextStop) return;
    if (current.status !== 'active') return;

    setLoading(true);
    setError(null);

    try {
      const stop = current.nextStop;
      const nextIndex = current.currentStopIndex + 1;
      const isLast = nextIndex >= current.allStops.length;

      const entry: CompletedStopLogEntry = {
        stopId: stop.id,
        completedAt: new Date().toISOString(),
        location: stop.location,
        droppedOff: stop.dropoffs.map(toPerson),
        pickedUp: stop.pickups.map(toPerson),
      };
      const updatedLog = [...logRef.current, entry];

      await updateDoc(doc(db, 'trips', current.tripId), {
        completedStops: updatedLog,
        ...(isLast ? { status: 'completed', endedAt: entry.completedAt } : {}),
      });

      logRef.current = updatedLog;

      const newStatus: TripStatus = isLast ? 'completed' : 'active';
      setTrip(buildTripState(current.allStops, nextIndex, current.tripId, newStatus));
    } catch (err: any) {
      console.error('[useActiveTrip] completeStop:', err);
      setError(err?.message ?? 'Failed to complete stop.');
    } finally {
      setLoading(false);
    }
  }, []);

  // endTrip

  const endTrip = useCallback(async () => {
    const current = tripRef.current;
    if (!current.tripId) return;

    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'trips', current.tripId), {
        status: 'completed',
        endedAt: new Date().toISOString(),
      });

      setTrip((prev) => ({ ...prev, status: 'completed', nextStop: null }));
    } catch (err: any) {
      console.error('[useActiveTrip] endTrip:', err);
      setError(err?.message ?? 'Failed to end trip.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { trip, loading, error, startTrip, completeStop, endTrip };
}
