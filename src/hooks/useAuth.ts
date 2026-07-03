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
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUser(snap.exists() ? (snap.data() as AuthUser) : null);
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
