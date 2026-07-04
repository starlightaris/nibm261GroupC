import { useEffect, useRef, useState } from 'react';
import { PassengerPreview } from '../types/trip';

interface LatLng {
  latitude: number;
  longitude: number;
}

const NEARING_RADIUS_METERS = 300;
const AUTO_HIDE_MS = 7000;

function getDistanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function useNearbyPassengerPreview(
  driverLocation: LatLng | null,
  passengers: PassengerPreview[]
) {
  const [visible, setVisible] = useState(false);
  const [nearbyPassengers, setNearbyPassengers] = useState<PassengerPreview[]>([]);
  const alreadyTriggeredFor = useRef<Set<string>>(new Set());
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!driverLocation) return;

    const nearby = passengers.filter((p) => {
      const dist = getDistanceMeters(driverLocation, {
        // now uses pickupLocation.latitude / longitude — matches RouteStop
        latitude: p.pickupLocation.latitude,
        longitude: p.pickupLocation.longitude,
      });
      return dist <= NEARING_RADIUS_METERS;
    });

    const newOnes = nearby.filter(
      (p) => !alreadyTriggeredFor.current.has(p.id)
    );

    if (newOnes.length > 0) {
      newOnes.forEach((p) => alreadyTriggeredFor.current.add(p.id));
      setNearbyPassengers(nearby);
      setVisible(true);

      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    }
  }, [driverLocation, passengers]);

  // Reset triggered set when remaining passengers list resets
  // (e.g. new trip started)
  useEffect(() => {
    if (passengers.length === 0) {
      alreadyTriggeredFor.current.clear();
    }
  }, [passengers.length]);

  return {
    visible,
    nearbyPassengers,
    dismiss: () => setVisible(false),
  };
}