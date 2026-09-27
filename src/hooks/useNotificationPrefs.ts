import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import {
  NotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
} from '../types/notifications';

export interface UseNotificationPrefsResult {
  prefs: NotificationPrefs;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updatePref: (key: keyof NotificationPrefs, value: boolean) => Promise<void>;
}


export function useNotificationPrefs(): UseNotificationPrefsResult {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubSnapshot?.();

      if (!firebaseUser) {
        setPrefs(DEFAULT_NOTIFICATION_PREFS);
        setLoading(false);
        return;
      }

      unsubSnapshot = onSnapshot(
        doc(db, 'notificationPrefs', firebaseUser.uid),
        (snap) => {
          setPrefs({
            ...DEFAULT_NOTIFICATION_PREFS,
            ...(snap.exists() ? (snap.data() as Partial<NotificationPrefs>) : {}),
          });
          setLoading(false);
        },
        (err) => {
          console.error('[useNotificationPrefs] snapshot:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubSnapshot?.();
    };
  }, []);

  const updatePref = useCallback(
    async (key: keyof NotificationPrefs, value: boolean) => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const next = { ...prefs, [key]: value };
      setPrefs(next); 
      setSaving(true);
      setError(null);

      try {
        await setDoc(doc(db, 'notificationPrefs', uid), next, { merge: true });
      } catch (err: any) {
        console.error('[useNotificationPrefs] updatePref:', err);
        setError(err?.message ?? 'Failed to save notification preference.');
      } finally {
        setSaving(false);
      }
    },
    [prefs]
  );

  return { prefs, loading, saving, error, updatePref };
}