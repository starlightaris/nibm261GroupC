import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { AuthUser } from '../types/auth';

export interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
}

/**
 * Shared auth/profile hook. Mirrors the role-resolution logic in
 * RootNavigator (auth state -> users/{uid} read) so any shared screen
 * (e.g. SettingsHome) can access the current user without duplicating
 * that Firestore read inline.
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        let snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        let userData = snap.exists() ? snap.data() : null;

        if (!userData) {
          const passengerSnap = await getDoc(doc(db, 'passengers', firebaseUser.uid));
          if (passengerSnap.exists()) userData = passengerSnap.data();
        }

        if (!userData) {
          const vehicleSnap = await getDoc(doc(db, 'vehicles', firebaseUser.uid));
          if (vehicleSnap.exists()) userData = vehicleSnap.data();
        }

        setUser(userData ? (userData as AuthUser) : null);
      } catch (err) {
        console.error('[useAuth]', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
