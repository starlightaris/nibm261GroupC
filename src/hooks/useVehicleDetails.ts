import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VehicleDetails {
  vehicleName: string;
  plateNumber: string;
  vehicleType: string;
  description: string;
  routeTags: string[];
  whatsappLink?: string;
}

export interface UseVehicleDetailsResult {
  vehicle: VehicleDetails | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveVehicle: (details: VehicleDetails) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Reads/writes vehicles/{uid} — but only the signup-time identity fields.
// capacity, inviteCode, and shiftTimes live on the same document but are
// owned by other screens (Community invite card, Shift Times), so this hook
// never reads or writes them.

export function useVehicleDetails(): UseVehicleDetailsResult {
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubVehicle: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubVehicle?.();

      if (!firebaseUser) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      unsubVehicle = onSnapshot(
        doc(db, 'vehicles', firebaseUser.uid),
        (snap) => {
          if (!snap.exists()) {
            setError('Vehicle profile not found.');
            setLoading(false);
            return;
          }
          const v = snap.data();
          setVehicle({
            vehicleName: v.vehicleName ?? '',
            plateNumber: v.plateNumber ?? '',
            vehicleType: v.vehicleType ?? '',
            description: v.description ?? '',
            routeTags: v.routeTags ?? [],
            whatsappLink: v.whatsappLink,
          });
          setLoading(false);
        },
        (err) => {
          console.error('[useVehicleDetails] snapshot:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubVehicle?.();
    };
  }, []);

  const saveVehicle = useCallback(async (details: VehicleDetails) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'vehicles', uid), {
        vehicleName: details.vehicleName,
        plateNumber: details.plateNumber,
        vehicleType: details.vehicleType,
        description: details.description,
        routeTags: details.routeTags,
        ...(details.whatsappLink
          ? { whatsappLink: details.whatsappLink }
          : {}),
      });
      // onSnapshot updates local state automatically
    } catch (err: any) {
      console.error('[useVehicleDetails] saveVehicle:', err);
      setError(err?.message ?? 'Failed to save vehicle details.');
    } finally {
      setSaving(false);
    }
  }, []);

  return { vehicle, loading, saving, error, saveVehicle };
}