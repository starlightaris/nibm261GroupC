import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  collection,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityMember {
  userId: string;
  name: string;
  initials: string;
  pickupLocation:  { latitude: number; longitude: number };
  dropoffLocation: { latitude: number; longitude: number };
}

export interface CommunityData {
  id: string | null;       // null when community doc doesn't exist yet
  driverId: string;
  vehicleId: string;
  inviteCode: string;
  vehicleName: string;
  plateNumber: string;

  members: CommunityMember[];
}

export interface UseCommunityResult {
  community: CommunityData | null;  // null only while loading or on error
  hasMembers: boolean;
  loading: boolean;
  error: string | null;
  removeMember: (userId: string) => Promise<void>;
  removing: string | null;
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
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [removing,  setRemoving]  = useState<string | null>(null);

  useEffect(() => {
    let unsubSnapshot: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      try {
        // ── Step 1: fetch vehicles/{uid} — always required ───────────────────
        const vehicleSnap = await getDoc(doc(db, 'vehicles', firebaseUser.uid));
        if (!vehicleSnap.exists()) {
          setError('Vehicle profile not found. Please complete registration.');
          setLoading(false);
          return;
        }
        const v = vehicleSnap.data();

        // ── Step 2: find community where driverId == uid ─────────────────────
        const commQuery = query(
          collection(db, 'communities'),
          where('driverId', '==', firebaseUser.uid)
        );
        const commSnap = await getDocs(commQuery);

        if (commSnap.empty) {
          // No community doc yet — show invite code from vehicle doc,
          // empty members list. Driver can still share invite code.
          setCommunity({
            id:          null,
            driverId:    firebaseUser.uid,
            vehicleId:   firebaseUser.uid,
            inviteCode:  v.inviteCode  ?? '',
            vehicleName: v.vehicleName ?? '',
            plateNumber: v.plateNumber ?? '',
      
            members:     [],
          });
          setLoading(false);
          return;
        }

        const commId = commSnap.docs[0].id;

        // ── Step 3: real-time listener on community doc ───────────────────────
        unsubSnapshot = onSnapshot(
          doc(db, 'communities', commId),
          (snap) => {
            if (!snap.exists()) {
              // Doc deleted — keep vehicle data, clear members
              setCommunity((prev) => prev ? { ...prev, id: null, members: [] } : null);
              return;
            }
            const data = snap.data();
            const members: CommunityMember[] = (data.members ?? []).map((m: any) => ({
              userId:          m.userId,
              name:            m.name,
              initials:        getInitials(m.name),
              pickupLocation:  m.pickupLocation,
              dropoffLocation: m.dropoffLocation,
            }));

            setCommunity({
              id:          commId,
              driverId:    data.driverId,
              vehicleId:   data.vehicleId ?? firebaseUser.uid,
              inviteCode:  v.inviteCode  ?? '',
              vehicleName: v.vehicleName ?? '',
              plateNumber: v.plateNumber ?? '',
        
              members,
            });
            setLoading(false);
          },
          (err) => {
            console.error('[useCommunity] snapshot:', err);
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
    if (!community?.id) return;
    setRemoving(userId);
    try {
      const updatedMembers = community.members
        .filter((m) => m.userId !== userId)
        .map(({ initials, ...rest }) => rest);

      await updateDoc(doc(db, 'communities', community.id), {
        members: updatedMembers,
      });
    } catch (err: any) {
      console.error('[useCommunity] removeMember:', err);
      setError(err?.message ?? 'Failed to remove member.');
    } finally {
      setRemoving(null);
    }
  }, [community]);

  return {
    community,
    hasMembers: (community?.members.length ?? 0) > 0,
    loading,
    error,
    removeMember,
    removing,
  };
}