import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PassengerMember {
  userId: string;
  name: string;
  pickupLocation:  { latitude: number; longitude: number } | null;
  dropoffLocation: { latitude: number; longitude: number } | null;
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

export function usePassengerCommunity(): UsePassengerCommunityResult {
  const [community, setCommunity] = useState<PassengerCommunity | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      try {
        // Query communities where members array contains this userId
        // Firestore array-contains works on primitive values only —
        // for object arrays we query by driverId then filter client-side
        // since we can't array-contains-object. Instead we query all
        // communities and check members[].userId.
        // For scale this is fine — one passenger is in at most one community.
        const commQuery = query(
          collection(db, 'communities'),
          where('memberIds', 'array-contains', firebaseUser.uid)
        );
        const commSnap = await getDocs(commQuery);

        if (commSnap.empty) {
          setCommunity(null);
          setLoading(false);
          return;
        }

        const commDoc  = commSnap.docs[0];
        const commData = commDoc.data();
        const commId   = commDoc.id;

        // Find this passenger's member entry
        const memberEntry = (commData.members ?? []).find(
          (m: any) => m.userId === firebaseUser.uid
        );

        if (!memberEntry) {
          setCommunity(null);
          setLoading(false);
          return;
        }

        // Fetch driver name from users/{driverId}
        const driverSnap = await getDoc(doc(db, 'users', commData.driverId));
        const driverName = driverSnap.exists() ? driverSnap.data().name : 'Your Driver';

        // Fetch vehicle details
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
      } catch (err: any) {
        console.error('[usePassengerCommunity]', err);
        setError(err?.message ?? 'Failed to load community.');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
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