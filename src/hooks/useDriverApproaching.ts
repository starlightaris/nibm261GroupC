import { useCallback, useRef } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  PROXIMITY_THRESHOLD_METERS, distanceMeters, etaMinutes, sendPush,
} from '@services/proximityService';
import type { TripStop } from '@utils/tripStops';
import type { Shift } from '@navigation/types';

interface Args {
  tripId: string | null;
  remainingStops: TripStop[];
  shift: Shift;
  communityId: string;
  enabled: boolean;
  thresholdMeters?: number;
}

type Coords = { latitude: number; longitude: number };

// Passengers already alerted, per trip. Module-level so leaving and re-opening
// the Active Trip screen mid-trip does not alert anyone twice.
const notifiedByTrip = new Map<string, Set<string>>();

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns a position handler. Feed it driver positions (from useLiveLocation's
 * watcher, so the screen holds a single location subscription) and it pushes
 * "your driver is nearby" to each passenger once, when the driver comes within range.
 */
export function useDriverApproaching({
  tripId, remainingStops, shift, communityId, enabled,
  thresholdMeters = PROXIMITY_THRESHOLD_METERS,
}: Args) {
  // Latest stops in a ref so the returned handler stays stable.
  const stopsRef = useRef(remainingStops);
  stopsRef.current = remainingStops;

  const alertPassenger = useCallback(async (uid: string, meters: number) => {
    try {
      const attendance = await getDocs(
        query(
          collection(db, 'attendance'),
          where('communityId', '==', communityId),
          where('date', '==', todayString()),
          where('userId', '==', uid),
        ),
      );
      const absent = attendance.docs.some((d) => {
        const r = d.data() as { shift?: string; status?: string };
        return r.shift === shift && r.status === 'absent';
      });
      if (absent) return;

      const data = (await getDoc(doc(db, 'users', uid))).data();
      const prefs = data?.notificationPrefs;
      if (prefs?.enabled === false || prefs?.driverApproaching === false) return;
      const token = data?.pushToken as string | undefined;
      if (!token) return;

      const mins = etaMinutes(meters);
      await sendPush(
        token,
        'Your driver is nearby',
        `Arriving in approximately ${mins} minute${mins === 1 ? '' : 's'}`,
        { type: 'driver_approaching' },
        { sound: prefs?.sound !== false },
      );
    } catch (e) {
      console.warn('[approaching] send failed', e);
    }
  }, [communityId, shift]);

  return useCallback((here: Coords) => {
    if (!enabled || !tripId) return;
    let notified = notifiedByTrip.get(tripId);
    if (!notified) {
      notified = new Set();
      notifiedByTrip.set(tripId, notified);
    }

    // remainingStops excludes completed stops, so picked-up passengers are skipped.
    for (const stop of stopsRef.current) {
      if (stop.pickups.length === 0) continue;
      const meters = distanceMeters(here, stop.location);
      if (meters > thresholdMeters) continue;

      for (const p of stop.pickups) {
        if (notified.has(p.userId)) continue;
        notified.add(p.userId); // mark first: never double-send
        alertPassenger(p.userId, meters);
      }
    }
  }, [enabled, tripId, thresholdMeters, alertPassenger]);
}
