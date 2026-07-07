import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
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
 *
 * Uses a real-time onSnapshot listener on users/{uid} (rather than a
 * one-time getDoc) so writes made elsewhere in the app — e.g. saving a
 * pickup/drop-off location from EditLocations — are reflected immediately
 * without requiring a screen remount or focus-based refetch.
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Auth state changed — tear down any previous profile listener first.
      unsubUser?.();
      unsubUser = null;

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      unsubUser = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          setUser(snap.exists() ? (snap.data() as AuthUser) : null);
          setLoading(false);
        },
        (err) => {
          console.error('[useAuth]', err);
          setUser(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubUser?.();
    };
  }, []);

  return { user, loading };
}