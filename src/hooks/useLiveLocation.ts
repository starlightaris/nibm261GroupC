import { useEffect } from 'react';
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
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Writes the driver's position to trips/{tripId}.driverLocation while `enabled`.
 *
 * Does not ask for permission: the Active Trip screen is wrapped in
 * LocationPermissionGate, so foreground access is already granted by the time
 * this runs. If it has been revoked, the watch fails and sharing silently stops.
 */
export function useLiveLocation({ tripId, enabled }: LiveLocationOptions) {
  useEffect(() => {
    if (!enabled || !tripId) return;

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.High,
        timeInterval:     5000,
        distanceInterval: 5,
      },
      ({ coords }) => {
        if (!isValidCoord(coords.latitude, coords.longitude)) {
          console.warn('[useLiveLocation] Invalid coordinates, skipping');
          return;
        }

        updateDoc(doc(db, 'trips', tripId), {
          driverLocation: {
            latitude:  coords.latitude,
            longitude: coords.longitude,
            heading:   coords.heading ?? null,
            updatedAt: new Date().toISOString(),
          },
        }).catch((err) => console.error('[useLiveLocation] Save failed:', err));
      }
    )
      .then((sub) => {
        if (cancelled) sub.remove();
        else subscription = sub;
      })
      .catch((err) => console.warn('[useLiveLocation] Could not start watching:', err));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, tripId]);
}
