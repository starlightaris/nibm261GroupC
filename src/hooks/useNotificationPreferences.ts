import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { setNotificationPreference } from '@services/notificationPreferencesService';
import {
  resolvePreferences,
  saveToggle,
  typesForRole,
  type NotificationPreferences,
  type NotificationType,
} from '@utils/notificationPreferences';

interface UseNotificationPreferencesResult {
  /** Toggles shown for the signed-in user's role. */
  types: ReturnType<typeof typesForRole>;
  preferences: NotificationPreferences;
  loading: boolean;
  loadError: string | null;
  saveError: string | null;
  /** Types whose save is still in flight (their switch is locked). */
  saving: Set<NotificationType>;
  setEnabled: (type: NotificationType, enabled: boolean) => Promise<void>;
  reload: () => void;
}

/**
 * Reads users/{uid} live, so the screen always opens with the saved values.
 * A toggle shows its new value straight away; if the save fails it goes
 * back to the stored value and saveError explains why.
 */
export function useNotificationPreferences(): UseNotificationPreferencesResult {
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stored, setStored] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, setPending] = useState<Partial<NotificationPreferences>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const inFlight = useRef<Set<NotificationType>>(new Set());

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    let unsubDoc: Unsubscribe | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubDoc?.();
      unsubDoc = null;

      if (!firebaseUser) {
        setUid(null);
        setLoadError('Sign in to change your notification settings.');
        setLoading(false);
        return;
      }

      setUid(firebaseUser.uid);
      unsubDoc = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          if (!snap.exists()) {
            setLoadError('Profile not found.');
          } else {
            const data = snap.data();
            setRole(data.role ?? null);
            setStored(data.notificationPreferences ?? null);
            setLoadError(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('[useNotificationPreferences]', err);
          setLoadError('Could not load your notification settings.');
          setLoading(false);
        },
      );
    });

    return () => {
      unsubDoc?.();
      unsubAuth();
    };
  }, [reloadKey]);

  const setEnabled = useCallback(
    async (type: NotificationType, enabled: boolean) => {
      if (!uid || inFlight.current.has(type)) return;

      inFlight.current.add(type);
      setSaveError(null);
      setPending((prev) => ({ ...prev, [type]: enabled }));

      const result = await saveToggle(uid, type, enabled, setNotificationPreference);

      inFlight.current.delete(type);
      // Drop the temporary value: on success the stored value now matches,
      // on failure this is what puts the switch back.
      setPending((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      if (!result.ok) {
        console.error('[useNotificationPreferences] save failed', result.error);
        setSaveError("Couldn't save that change. Please try again.");
      }
    },
    [uid],
  );

  const preferences = resolvePreferences({
    ...(stored && typeof stored === 'object' ? stored : {}),
    ...pending,
  });

  return {
    types: typesForRole(role),
    preferences,
    loading,
    loadError,
    saveError,
    saving: new Set(Object.keys(pending) as NotificationType[]),
    setEnabled,
    reload: () => setReloadKey((k) => k + 1),
  };
}
