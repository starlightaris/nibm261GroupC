import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { logoutUser } from '@services/authService';
import { DriverProfile } from '../types/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShiftTimes {
  morningCutoff: string; // HH:MM
  eveningCutoff: string; // HH:MM
}

export interface DriverSettings {
  profile: DriverProfile;
  vehicleName: string;
  plateNumber: string;
  capacity: number;
  inviteCode: string;
  shiftTimes: ShiftTimes;
}

export interface UseSettingsResult {
  settings: DriverSettings | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveShiftTimes: (times: ShiftTimes) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<DriverSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    let unsubVehicle: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile (one-time — role/name/phone rarely change)
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userSnap.exists()) {
          setError('Profile not found.');
          setLoading(false);
          return;
        }
        const profile = userSnap.data() as DriverProfile;

        // Real-time listener on vehicles/{uid} so shift time edits reflect immediately
        unsubVehicle = onSnapshot(
          doc(db, 'vehicles', firebaseUser.uid),
          (snap) => {
            if (!snap.exists()) {
              setError('Vehicle profile not found.');
              setLoading(false);
              return;
            }
            const v = snap.data();
            setSettings({
              profile,
              vehicleName: v.vehicleName ?? '',
              plateNumber: v.plateNumber ?? '',
              capacity:    v.capacity    ?? 4,
              inviteCode:  v.inviteCode  ?? '',
              shiftTimes: {
                morningCutoff: v.shiftTimes?.morningCutoff ?? '09:00',
                eveningCutoff: v.shiftTimes?.eveningCutoff ?? '17:00',
              },
            });
            setLoading(false);
          },
          (err) => {
            console.error('[useSettings] snapshot:', err);
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.error('[useSettings]', err);
        setError(err?.message ?? 'Failed to load settings.');
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubVehicle?.();
    };
  }, []);

  // ── saveShiftTimes ──────────────────────────────────────────────────────────

  const saveShiftTimes = useCallback(async (times: ShiftTimes) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Basic validation — morning must be before evening
    const [mH, mM] = times.morningCutoff.split(':').map(Number);
    const [eH, eM] = times.eveningCutoff.split(':').map(Number);
    if (mH * 60 + mM >= eH * 60 + eM) {
      setError('Morning cutoff must be earlier than evening cutoff.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'vehicles', uid), {
        shiftTimes: { morningCutoff: times.morningCutoff, eveningCutoff: times.eveningCutoff },
      });
      // onSnapshot will update local state automatically
    } catch (err: any) {
      console.error('[useSettings] saveShiftTimes:', err);
      setError(err?.message ?? 'Failed to save shift times.');
    } finally {
      setSaving(false);
    }
  }, []);

  // ── logout ──────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await logoutUser();
  }, []);

  return { settings, loading, error, saving, saveShiftTimes, logout };
}