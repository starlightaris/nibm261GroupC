import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';
export type Shift = 'morning' | 'evening';

export interface ShiftAttendance {
  status: AttendanceStatus;
  markedAt: string | null;
  docId: string | null;
}

export interface TodayAttendance {
  morning: ShiftAttendance;
  evening: ShiftAttendance;
}

export interface UseAttendanceResult {
  attendance: TodayAttendance;
  loading: boolean;
  marking: Shift | null;   // which shift is currently being saved
  error: string | null;
  mark: (shift: Shift, status: AttendanceStatus) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_SHIFT: ShiftAttendance = { status: 'unmarked', markedAt: null, docId: null };
const DEFAULT_ATTENDANCE: TodayAttendance = { morning: DEFAULT_SHIFT, evening: DEFAULT_SHIFT };

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAttendance(
  communityId: string | null
): UseAttendanceResult {
  const [attendance, setAttendance] = useState<TodayAttendance>(DEFAULT_ATTENDANCE);
  const [loading,    setLoading]    = useState(true);
  const [marking,    setMarking]    = useState<Shift | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const today = getTodayString();
  const uid   = auth.currentUser?.uid ?? null;

  // ── Fetch today's attendance ──────────────────────────────────────────────

  useEffect(() => {
    if (!communityId || !uid) {
      setLoading(false);
      return;
    }

    async function fetch() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'attendance'),
          where('communityId', '==', communityId),
          where('userId',      '==', uid),
          where('date',        '==', today)
        );
        const snap = await getDocs(q);

        const result: TodayAttendance = { ...DEFAULT_ATTENDANCE };

        snap.forEach((d) => {
          const data  = d.data();
          const shift = data.shift as Shift;
          if (shift === 'morning' || shift === 'evening') {
            result[shift] = {
              status:   data.status   ?? 'unmarked',
              markedAt: data.markedAt ?? null,
              docId:    d.id,
            };
          }
        });

        setAttendance(result);
      } catch (err: any) {
        console.error('[useAttendance] fetch:', err);
        setError(err?.message ?? 'Failed to load attendance.');
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [communityId, uid, today]);

  // ── Mark attendance ───────────────────────────────────────────────────────

  const mark = useCallback(async (shift: Shift, status: AttendanceStatus) => {
    if (!communityId || !uid) return;

    const userSnap = await import('firebase/firestore').then(({ getDoc, doc: fDoc }) =>
      getDoc(fDoc(db, 'users', uid))
    );
    const userName = userSnap.exists() ? userSnap.data().name : 'Passenger';

    setMarking(shift);
    setError(null);

    try {
      const existing = attendance[shift];
      const now      = new Date().toISOString();

      if (existing.docId) {
        // Update existing doc
        await updateDoc(doc(db, 'attendance', existing.docId), {
          status,
          markedAt: now,
        });
      } else {
        // Create new doc
        const newRef = doc(collection(db, 'attendance'));
        await setDoc(newRef, {
          communityId,
          userId:    uid,
          userName,
          date:      today,
          shift,
          status,
          markedAt:  now,
          createdAt: now,
        });
        // Update local docId so next save is an update not a create
        setAttendance((prev) => ({
          ...prev,
          [shift]: { ...prev[shift], docId: newRef.id },
        }));
      }

      // Optimistic local update
      setAttendance((prev) => ({
        ...prev,
        [shift]: { ...prev[shift], status, markedAt: now },
      }));
    } catch (err: any) {
      console.error('[useAttendance] mark:', err);
      setError(err?.message ?? 'Failed to save attendance.');
    } finally {
      setMarking(null);
    }
  }, [communityId, uid, today, attendance]);

  return { attendance, loading, marking, error, mark };
}
