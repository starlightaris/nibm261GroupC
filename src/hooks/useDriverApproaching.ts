import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  PROXIMITY_THRESHOLD_METERS, distanceMeters, etaMinutes, sendPush,
} from '@services/proximityService';
import { dateKey } from '@services/attendanceReminderService';
import type { TripStop } from '@utils/tripStops';
import type { Shift } from '@navigation/types';

interface Args {
  remainingStops: TripStop[];
  shift: Shift;
  communityId: string;
  enabled: boolean;
  thresholdMeters?: number;
}

export function useDriverApproaching({
  remainingStops, shift, communityId, enabled,
  thresholdMeters = PROXIMITY_THRESHOLD_METERS,
}: Args) {
  // Passengers already alerted: one notification per passenger.
  const notified = useRef<Set<string>>(new Set());

  // Latest stops in a ref so the location watcher is created only once.
  const stopsRef = useRef(remainingStops);
  stopsRef.current = remainingStops;

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function isAbsent(uid: string): Promise<boolean> {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'attendance'),
            where('communityId', '==', communityId),
            where('date', '==', dateKey(new Date())),
            where('userId', '==', uid),
          ),
        );
        return snap.docs.some((d) => {
          const r = d.data() as { shift?: string; status?: string };
          return r.shift === shift && r.status === 'absent';
        });
      } catch {
        return false; // if the check fails, don't block the alert
      }
    }

    async function alertPassenger(uid: string, meters: number) {
      try {
        if (await isAbsent(uid)) return;
        const snap = await getDoc(doc(db, 'users', uid));
        const token = snap.data()?.pushToken as string | undefined;
        if (!token) return;
        const mins = etaMinutes(meters);
        await sendPush(
          token,
          'Your driver is nearby',
          `Arriving in approximately ${mins} minute${mins === 1 ? '' : 's'}`,
          { type: 'driver_approaching' },
        );
      } catch (e) {
        console.warn('[approaching] send failed', e);
      }
    }

    async function start() {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted' || cancelled) return;

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 25,
        },
        (pos) => {
          const here = pos.coords;
          // remainingStops excludes completed stops, so picked-up passengers are skipped.
          for (const stop of stopsRef.current) {
            if (stop.pickups.length === 0) continue;
            const meters = distanceMeters(here, stop.location);
            if (meters > thresholdMeters) continue;

            for (const p of stop.pickups) {
              if (notified.current.has(p.userId)) continue;
              notified.current.add(p.userId); // mark first: never double-send
              alertPassenger(p.userId, meters);
            }
          }
        },
      );
      if (cancelled) sub.remove();
    }

    start().catch((e) => console.warn('[approaching] watch failed', e));

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled, communityId, shift, thresholdMeters]);
}