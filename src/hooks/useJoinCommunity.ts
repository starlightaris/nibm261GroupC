import { useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export interface UseJoinCommunityResult {
  joining: boolean;
  error: string | null;
  join: (inviteCode: string) => Promise<boolean>;
}

export function useJoinCommunity(): UseJoinCommunityResult {
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const join = useCallback(async (inviteCode: string): Promise<boolean> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setError('Not authenticated.');
      return false;
    }

    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter an invite code.');
      return false;
    }

    setJoining(true);
    setError(null);

    try {
      // ── Step 1: find vehicle doc with matching inviteCode ─────────────────
      const vehicleQuery = query(
        collection(db, 'vehicles'),
        where('inviteCode', '==', code)
      );
      const vehicleSnap = await getDocs(vehicleQuery);

      if (vehicleSnap.empty) {
        setError('Invalid invite code. Please check and try again.');
        return false;
      }

      const vehicleDoc  = vehicleSnap.docs[0];
      const driverId    = vehicleDoc.data().driverId;

      // ── Step 2: find the driver's community doc ───────────────────────────
      const commQuery = query(
        collection(db, 'communities'),
        where('driverId', '==', driverId)
      );
      const commSnap = await getDocs(commQuery);

      if (commSnap.empty) {
        setError('This driver has not set up a community yet.');
        return false;
      }

      const commDoc  = commSnap.docs[0];
      const commId   = commDoc.id;
      const commData = commDoc.data();

      // ── Step 3: check not already a member ───────────────────────────────
      const alreadyMember = (commData.members ?? []).some(
        (m: any) => m.userId === firebaseUser.uid
      );
      if (alreadyMember) {
        setError('You are already a member of this community.');
        return false;
      }

      // ── Step 4: fetch passenger's name from users/{uid} ──────────────────
      const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userName = userSnap.exists() ? userSnap.data().name : 'Passenger';

      // ── Step 5: add passenger to members array ────────────────────────────
      // memberIds is a flat string array for array-contains queries.
      // members is the full object array with location data.
      await updateDoc(doc(db, 'communities', commId), {
        memberIds: arrayUnion(firebaseUser.uid),
        members:   arrayUnion({
          userId:          firebaseUser.uid,
          name:            userName,
          pickupLocation:  null,   // set later via Edit Locations
          dropoffLocation: null,
        }),
      });

      return true;
    } catch (err: any) {
      console.error('[useJoinCommunity]', err);
      setError(err?.message ?? 'Failed to join community.');
      return false;
    } finally {
      setJoining(false);
    }
  }, []);

  return { joining, error, join };
}