import { useState, useCallback, useRef } from 'react';
import {collection, doc, addDoc, updateDoc, query, where, getDocs, serverTimestamp,} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { RouteStop, Shift } from '@hooks/useDriverRoute';

// Types

export type TripStatus = 'pending' | 'active' | 'completed';

export interface ActiveTripState {
  tripId: string | null;
  status: TripStatus;
  currentStopIndex: number;
  /** Stops remaining (from currentStopIndex onward) */
  remainingStops: RouteStop[];
  /** Passengers already picked up */
  completedStops: RouteStop[];
  /** The next stop the driver is heading to */
  nextStop: RouteStop | null;
  /** All stops passed in from Route screen */
  allStops: RouteStop[];
}

export interface UseActiveTripResult {
  trip: ActiveTripState;
  loading: boolean;
  error: string | null;
  /** Call once when driver taps "Start Trip" — creates the trips/ doc */
  startTrip: (params: StartTripParams) => Promise<void>;
  /** Advance to next stop; marks current passenger as picked up */
  markPickedUp: () => Promise<void>;
  /** End the trip after the last stop */
  endTrip: () => Promise<void>;
}

export interface StartTripParams {
  stops: RouteStop[];
  shift: Shift;
  communityId: string;
}

// Helpers

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildTripState(
  stops: RouteStop[],
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
        const resumeIndex: number = existingData.stops?.length ?? 0;

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
          stops: [], // filled incrementally as passengers are picked up
        });
        tripId = tripDoc.id;

        setTrip(buildTripState(stops, 0, tripId, 'active'));
      }
    } catch (err: any) {
      console.error('[useActiveTrip] startTrip:', err);
      setError(err?.message ?? 'Failed to start trip.');
    } finally {
      setLoading(false);
    }
  }, []);

  // markPickedUp

  const markPickedUp = useCallback(async () => {
    const current = tripRef.current;
    if (!current.tripId || !current.nextStop) return;
    if (current.status !== 'active') return;

    setLoading(true);
    setError(null);

    try {
      const pickedUpStop = current.nextStop;
      const nextIndex = current.currentStopIndex + 1;
      const isLast = nextIndex >= current.allStops.length;

      // Append to the stops[] array in Firestore using arrayUnion equivalent
      // (arrayUnion doesn't preserve order reliably for objects, so we fetch
      //  and rewrite the full array — trips docs are small so this is safe)
      const updatedStops = [
        ...current.completedStops.map((s) => ({
          userId: s.userId,
          name: s.name,
          pickedUpAt: null, // already written in previous calls
        })),
        {
          userId: pickedUpStop.userId,
          name: pickedUpStop.name,
          pickedUpAt: new Date().toISOString(),
        },
      ];

      await updateDoc(doc(db, 'trips', current.tripId), {
        stops: updatedStops,
        ...(isLast ? { status: 'completed', endedAt: new Date().toISOString() } : {}),
      });

      const newStatus: TripStatus = isLast ? 'completed' : 'active';
      setTrip(buildTripState(current.allStops, nextIndex, current.tripId, newStatus));
    } catch (err: any) {
      console.error('[useActiveTrip] markPickedUp:', err);
      setError(err?.message ?? 'Failed to mark passenger as picked up.');
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

  return { trip, loading, error, startTrip, markPickedUp, endTrip };
}