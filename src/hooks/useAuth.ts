import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { AuthUser } from '../types/auth';

export interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
}

/** Keeps the signed-in user's Firestore profile in sync across settings screens. */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
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
          if (!snap.exists()) {
            setUser(null);
          } else {
            const data = snap.data();
            setUser({
              ...data,
              uid: firebaseUser.uid,
              email: data.email ?? firebaseUser.email ?? '',
            } as AuthUser);
          }
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
