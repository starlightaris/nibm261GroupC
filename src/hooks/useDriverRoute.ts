import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteStop {
  userId: string;
  name: string;
  initials: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    latitude: number;
    longitude: number;
  };
  attendanceStatus: 'present' | 'absent' | 'unmarked';
}

export type Shift = 'morning' | 'evening';

export interface UseDriverRouteResult {
  stops: RouteStop[];           // only confirmed-present passengers, ordered
  allMembers: RouteStop[];      // every community member (for absent indicators)
  activeShift: Shift | null;
  communityId: string | null;
  loading: boolean;
  error: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayString(): string {
  // YYYY-MM-DD in local time
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Determines the active shift from the vehicle's shiftTimes cutoffs.
 *
 * Logic:
 *   - Before morningCutoff  → morning shift is upcoming (show morning route)
 *   - After morningCutoff and before eveningCutoff → evening shift is next
 *   - After eveningCutoff → evening shift (end of day)
 *
 * Both cutoffs are HH:MM strings (24-hour).
 */
function resolveActiveShift(
  morningCutoff: string,
  eveningCutoff: string
): Shift {
  const now = new Date();
  const [mH, mM] = morningCutoff.split(':').map(Number);
  const [eH, eM] = eveningCutoff.split(':').map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const morningMinutes = mH * 60 + mM;
  const eveningMinutes = eH * 60 + eM;

  // Before or at morning cutoff → show morning route
  if (nowMinutes <= morningMinutes) return 'morning';
  // Between morning and evening cutoff → show evening route
  if (nowMinutes <= eveningMinutes) return 'evening';
  // After evening cutoff → still show evening (last shift of the day)
  return 'evening';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// Hook

export function useDriverRoute(): UseDriverRouteResult {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [allMembers, setAllMembers] = useState<RouteStop[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to resolve before querying
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }
      fetchRoute(firebaseUser.uid);
    });

    return () => unsubscribe();
  }, []);

  async function fetchRoute(driverUid: string) {
    setLoading(true);
    setError(null);

    try {
      const today = getTodayString();

      // fetch vehicles/{uid} to determine active shift
      const vehicleSnap = await getDoc(doc(db, 'vehicles', driverUid));
      if (!vehicleSnap.exists()) {
        throw new Error('Vehicle profile not found. Please complete registration.');
      }
      const vehicleData = vehicleSnap.data();
      const shift = resolveActiveShift(
        vehicleData.shiftTimes?.morningCutoff ?? '09:00',
        vehicleData.shiftTimes?.eveningCutoff ?? '17:00'
      );
      setActiveShift(shift);

      // fetch this driver's community
      const commQuery = query(
        collection(db, 'communities'),
        where('driverId', '==', driverUid)
      );
      const commSnap = await getDocs(commQuery);
      if (commSnap.empty) {
        // Driver has no community yet — return empty route gracefully
        setStops([]);
        setAllMembers([]);
        setLoading(false);
        return;
      }

      // Take the first community (one driver → one community in this model)
      const commDoc = commSnap.docs[0];
      const commId = commDoc.id;
      const members: Array<{
        userId: string;
        name: string;
        pickupLocation: { latitude: number; longitude: number };
        dropoffLocation: { latitude: number; longitude: number };
      }> = commDoc.data().members ?? [];
      setCommunityId(commId);

      if (members.length === 0) {
        setStops([]);
        setAllMembers([]);
        setLoading(false);
        return;
      }

      // fetch today's attendance for this community + shift
      const memberIds = members.map((m) => m.userId);

      // Firestore 'in' supports up to 30 items; chunk if needed
      const CHUNK = 30;
      const attendanceDocs: Record<
        string,
        'present' | 'absent' | 'unmarked'
      > = {};

      for (let i = 0; i < memberIds.length; i += CHUNK) {
        const chunk = memberIds.slice(i, i + CHUNK);
        const attQuery = query(
          collection(db, 'attendance'),
          where('communityId', '==', commId),
          where('date', '==', today),
          where('shift', '==', shift),
          where('userId', 'in', chunk)
        );
        const attSnap = await getDocs(attQuery);
        attSnap.forEach((d) => {
          const data = d.data();
          attendanceDocs[data.userId] = data.status ?? 'unmarked';
        });
      }

      // merge members with attendance status
      const merged: RouteStop[] = members.map((m) => ({
        userId: m.userId,
        name: m.name,
        initials: getInitials(m.name),
        pickupLocation: m.pickupLocation,
        dropoffLocation: m.dropoffLocation,
        attendanceStatus: attendanceDocs[m.userId] ?? 'unmarked',
      }));

      setAllMembers(merged);

      // confirmed-present passengers only, for the active route
      // "unmarked" passengers are included — driver sees them as tentative stops.
      // Only explicitly absent passengers are excluded.
      const activeStops = merged.filter(
        (m) => m.attendanceStatus !== 'absent'
      );

      setStops(activeStops);
    } catch (err: any) {
      console.error('[useDriverRoute]', err);
      setError(err?.message ?? 'Failed to load route.');
    } finally {
      setLoading(false);
    }
  }

  return { stops, allMembers, activeShift, communityId, loading, error };
}