import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityMember {
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
}

export interface CommunityData {
  id: string;
  driverId: string;
  vehicleId: string;
  inviteCode: string;
  vehicleName: string;
  plateNumber: string;
  capacity: number;
  members: CommunityMember[];
}

export interface UseCommunityResult {
  community: CommunityData | null;
  loading: boolean;
  error: string | null;
  /** Remove a passenger from the community members array */
  removeMember: (userId: string) => Promise<void>;
  removing: string | null; // userId currently being removed
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCommunity(): UseCommunityResult {
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    let unsubSnapshot: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      try {
        // ── Step 1: fetch vehicles/{uid} for invite code + vehicle details ──
        const vehicleSnap = await getDoc(doc(db, 'vehicles', firebaseUser.uid));
        if (!vehicleSnap.exists()) {
          setError('Vehicle profile not found. Complete registration first.');
          setLoading(false);
          return;
        }
        const vehicleData = vehicleSnap.data();

        // ── Step 2: find community where driverId == uid ─────────────────────
        // We avoid a collection query by deriving communityId from the driver's
        // known vehicle doc. Communities store driverId so we use a query —
        // but we also listen in real-time so member changes reflect instantly.
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const commQuery = query(
          collection(db, 'communities'),
          where('driverId', '==', firebaseUser.uid)
        );
        const commSnap = await getDocs(commQuery);

        if (commSnap.empty) {
          // No community yet — return empty state, not an error
          setCommunity(null);
          setLoading(false);
          return;
        }

        const commDoc = commSnap.docs[0];
        const commId  = commDoc.id;

        // ── Step 3: real-time listener on the community doc ──────────────────
        unsubSnapshot = onSnapshot(
          doc(db, 'communities', commId),
          (snap) => {
            if (!snap.exists()) {
              setCommunity(null);
              return;
            }
            const data = snap.data();
            const members: CommunityMember[] = (data.members ?? []).map((m: any) => ({
              userId: m.userId,
              name: m.name,
              initials: getInitials(m.name),
              pickupLocation: m.pickupLocation,
              dropoffLocation: m.dropoffLocation,
            }));

            setCommunity({
              id: commId,
              driverId: data.driverId,
              vehicleId: data.vehicleId ?? firebaseUser.uid,
              inviteCode: vehicleData.inviteCode ?? '',
              vehicleName: vehicleData.vehicleName ?? '',
              plateNumber: vehicleData.plateNumber ?? '',
              capacity: vehicleData.capacity ?? 4,
              members,
            });
            setLoading(false);
          },
          (err) => {
            console.error('[useCommunity] snapshot error:', err);
            setError(err.message ?? 'Failed to load community.');
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.error('[useCommunity]', err);
        setError(err?.message ?? 'Failed to load community.');
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubSnapshot?.();
    };
  }, []);

  // ── removeMember ────────────────────────────────────────────────────────────

  const removeMember = useCallback(async (userId: string) => {
    if (!community) return;
    setRemoving(userId);

    try {
      const updatedMembers = community.members
        .filter((m) => m.userId !== userId)
        .map(({ initials, ...rest }) => rest); // strip client-only initials before writing

      await updateDoc(doc(db, 'communities', community.id), {
        members: updatedMembers,
      });
      // onSnapshot will automatically update local state — no manual setCommunity needed
    } catch (err: any) {
      console.error('[useCommunity] removeMember:', err);
      setError(err?.message ?? 'Failed to remove member.');
    } finally {
      setRemoving(null);
    }
  }, [community]);

  return { community, loading, error, removeMember, removing };
}