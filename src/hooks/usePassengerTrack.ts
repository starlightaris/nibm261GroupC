import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BusLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  isSharing: boolean;
  updatedAt: any;
}

export interface StopWithEta {
  name: string;
  latitude: number;
  longitude: number;
  etaMinutes: number | null;
  isPast: boolean;
}

export interface PassengerTrackState {
  busLocation: BusLocation | null;
  etaMinutes: number | null;
  recentStops: StopWithEta[];
  driverName: string | null;
  vehicleNickname: string | null;
  isSharing: boolean;
  loading: boolean;
  error: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Calculate straight-line distance in km between two coordinates
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Estimate ETA in minutes assuming average speed of 30 km/h in Sri Lanka traffic
function estimateEta(
  busLat: number, busLon: number,
  stopLat: number, stopLon: number
): number {
  const distKm = haversineKm(busLat, busLon, stopLat, stopLon);
  const avgSpeedKmh = 30;
  return Math.round((distKm / avgSpeedKmh) * 60);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePassengerTrack(): PassengerTrackState {
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [recentStops, setRecentStops] = useState<StopWithEta[]>([]);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [vehicleNickname, setVehicleNickname] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Step 1 — find which community/driver this passenger belongs to
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      try {
        // Find community where this passenger is a member
        const commSnap = await getDoc(doc(db, 'users', user.uid));
        if (!commSnap.exists()) {
          setError('User profile not found');
          setLoading(false);
          return;
        }

        // Find the community this passenger belongs to
        const commQuery = query(
          collection(db, 'communities'),
          where('members', 'array-contains', { userId: user.uid })
        );

        // Try direct lookup via passenger's communityId field
        const userSnap = await getDoc(doc(db, 'passengers', user.uid));
        const userData = userSnap.exists() ? userSnap.data() : null;

        // Store passenger's pickup location for ETA calculation
        if (userData?.pickupLocation) {
          setPassengerLocation({
            latitude: userData.pickupLocation.latitude ?? 0,
            longitude: userData.pickupLocation.longitude ?? 0,
          });
        }

        // Find driver via communities collection
        const commCollSnap = await getDoc(
          doc(db, 'communities', userData?.communityId ?? 'none')
        );

        if (commCollSnap.exists()) {
          const foundDriverId = commCollSnap.data().driverId;
          setDriverId(foundDriverId);

          // Fetch driver name and vehicle nickname
          const [driverSnap, vehicleSnap] = await Promise.all([
            getDoc(doc(db, 'users', foundDriverId)),
            getDoc(doc(db, 'vehicles', foundDriverId)),
          ]);

          if (driverSnap.exists()) setDriverName(driverSnap.data().name);
          if (vehicleSnap.exists()) setVehicleNickname(vehicleSnap.data().nickname);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('[usePassengerTrack]', err);
        setError(err?.message ?? 'Failed to load tracking data');
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // Step 2 — listen to driver's live location in real time
  useEffect(() => {
    if (!driverId) return;

    const unsubLocation = onSnapshot(
      doc(db, 'liveLocations', driverId),
      (snap) => {
        if (!snap.exists()) {
          setIsSharing(false);
          setBusLocation(null);
          return;
        }

        const data = snap.data() as BusLocation;
        setBusLocation(data);
        setIsSharing(data.isSharing ?? false);

        // Calculate ETA to passenger's pickup location
        if (data.isSharing && passengerLocation) {
          const eta = estimateEta(
            data.latitude,
            data.longitude,
            passengerLocation.latitude,
            passengerLocation.longitude
          );
          setEtaMinutes(eta);
        }
      },
      (err) => {
        console.error('[usePassengerTrack] location listener:', err);
        setError('Failed to get live location');
      }
    );

    return () => unsubLocation();
  }, [driverId, passengerLocation]);

  // Step 3 — listen to today's trip stops for recent stop history
  useEffect(() => {
    if (!driverId) return;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const tripsQuery = query(
      collection(db, 'trips'),
      where('driverId', '==', driverId),
      where('date', '==', todayStr),
      where('status', 'in', ['active', 'completed'])
    );

    const unsubTrips = onSnapshot(tripsQuery, (snap) => {
      if (snap.empty) {
        setRecentStops([]);
        return;
      }

      const tripData = snap.docs[0].data();
      const stops: any[] = tripData.stops ?? [];

      // Get last 3-4 completed stops with ETA from bus location
      const recent = stops
        .slice(-4)
        .map((s: any) => ({
          name: s.name ?? 'Stop',
          latitude: s.pickupLocation?.latitude ?? 0,
          longitude: s.pickupLocation?.longitude ?? 0,
          etaMinutes: busLocation
            ? estimateEta(
                busLocation.latitude,
                busLocation.longitude,
                s.pickupLocation?.latitude ?? 0,
                s.pickupLocation?.longitude ?? 0
              )
            : null,
          isPast: !!s.pickedUpAt,
        }));

      setRecentStops(recent);
    });

    return () => unsubTrips();
  }, [driverId, busLocation]);

  return {
    busLocation,
    etaMinutes,
    recentStops,
    driverName,
    vehicleNickname,
    isSharing,
    loading,
    error,
  };
}