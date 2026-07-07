import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberLocation {
  address:   string;
  latitude:  number;
  longitude: number;
}

export interface PassengerMember {
  userId: string;
  name: string;
  pickupLocation:  MemberLocation | null;
  dropoffLocation: MemberLocation | null;
}

export interface PassengerCommunity {
  communityId: string;
  driverId: string;
  driverName: string;
  vehicleName: string;
  plateNumber: string;
  inviteCode: string;
  member: PassengerMember;
}

export interface UsePassengerCommunityResult {
  community: PassengerCommunity | null;
  joined: boolean;
  hasLocations: boolean;
  loading: boolean;
  error: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Live view of the passenger's community membership and saved locations.
 *
 * Uses onSnapshot (not a one-time getDocs) on the community query, so any
 * write from elsewhere in the app — joining a community (useJoinCommunity),
 * or saving a pickup/drop-off location (communityLocationService) — is
 * reflected here immediately, without needing the screen to remount or the
 * user to log out and back in. Driver name / vehicle details are read once
 * with getDoc since they don't change mid-session.
 */
export function usePassengerCommunity(): UsePassengerCommunityResult {
  const [community, setCommunity] = useState<PassengerCommunity | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    let unsubCommunity: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Auth state changed — tear down any previous community listener first.
      unsubCommunity?.();
      unsubCommunity = null;

      if (!firebaseUser) {
        setCommunity(null);
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      setLoading(true);

      // Firestore array-contains works on primitive values only — for
      // object arrays we query by memberIds (a flat array of uids kept in
      // sync alongside members[]) rather than array-contains-object.
      // For scale this is fine — one passenger is in at most one community.
      const commQuery = query(
        collection(db, 'communities'),
        where('memberIds', 'array-contains', firebaseUser.uid)
      );

      unsubCommunity = onSnapshot(
        commQuery,
        async (commSnap) => {
          try {
            if (commSnap.empty) {
              setCommunity(null);
              setError(null);
              setLoading(false);
              return;
            }

            const commDoc  = commSnap.docs[0];
            const commData = commDoc.data();
            const commId   = commDoc.id;

            const memberEntry = (commData.members ?? []).find(
              (m: any) => m.userId === firebaseUser.uid
            );

            if (!memberEntry) {
              setCommunity(null);
              setError(null);
              setLoading(false);
              return;
            }

            const driverSnap  = await getDoc(doc(db, 'users', commData.driverId));
            const driverName  = driverSnap.exists() ? driverSnap.data().name : 'Your Driver';
            const vehicleSnap = await getDoc(doc(db, 'vehicles', commData.driverId));
            const vehicleData = vehicleSnap.exists() ? vehicleSnap.data() : {};

            setCommunity({
              communityId: commId,
              driverId:    commData.driverId,
              driverName,
              vehicleName: vehicleData.vehicleName ?? '',
              plateNumber: vehicleData.plateNumber ?? '',
              inviteCode:  vehicleData.inviteCode  ?? '',
              member: {
                userId:          firebaseUser.uid,
                name:            memberEntry.name,
                pickupLocation:  memberEntry.pickupLocation  ?? null,
                dropoffLocation: memberEntry.dropoffLocation ?? null,
              },
            });
            setError(null);
          } catch (err: any) {
            console.error('[usePassengerCommunity]', err);
            setError(err?.message ?? 'Failed to load community.');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error('[usePassengerCommunity]', err);
          setError(err?.message ?? 'Failed to load community.');
          setLoading(false);
        }
      );
    });

    return () => {
      unsubCommunity?.();
      unsubAuth();
    };
  }, []);

  const hasLocations =
    community?.member.pickupLocation  != null &&
    community?.member.dropoffLocation != null;

  return {
    community,
    joined:      community !== null,
    hasLocations,
    loading,
    error,
  };
}
