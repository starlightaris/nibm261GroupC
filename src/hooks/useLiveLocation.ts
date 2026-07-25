import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveLocationOptions {
  tripId:  string | null;
  enabled: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidCoord(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLiveLocation({ tripId, enabled }: LiveLocationOptions) {
  const watchRef    = useRef<Location.LocationSubscription | null>(null);
  const cancelledRef = useRef(false);

  // ── Permission request ──────────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }, []);

  // ── Save location to Firestore ──────────────────────────────────────────────
  const saveLocation = useCallback(
    async (lat: number, lng: number, heading: number | null) => {
      if (!tripId) return;

      //validate before saving
      if (!isValidCoord(lat, lng)) {
        console.warn('[useLiveLocation] Invalid coordinates, skipping');
        return;
      }

      try {
        await updateDoc(doc(db, 'trips', tripId), {
          driverLocation: {
            latitude:  lat,
            longitude: lng,
            heading:   heading ?? null,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error('[useLiveLocation] Save failed:', err);
      }
    },
    [tripId]
  );

  // ── Start / stop tracking ───────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !tripId) return;

    cancelledRef.current = false;

    // request permission then start foreground tracking
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted' || cancelledRef.current) return;

      Location.watchPositionAsync(
        {
          accuracy:         Location.Accuracy.High,
          timeInterval:     5000,  //  every 5 seconds
          distanceInterval: 5,
        },
        (location) => {
          const { latitude, longitude, heading } = location.coords;
          saveLocation(latitude, longitude, heading ?? null);
        }
      ).then((sub) => {
        if (cancelledRef.current) {
          sub.remove();
        } else {
          watchRef.current = sub;
        }
      });
    });

    // stop when trip ends or screen unmounts
    return () => {
      cancelledRef.current = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [enabled, tripId, saveLocation]);

  return { requestPermission };
}