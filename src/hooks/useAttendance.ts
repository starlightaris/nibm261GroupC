import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import {
  cancelAttendanceReminder,
  syncAttendanceReminder,
} from '@services/attendanceNotificationService';

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';
export type MarkableAttendanceStatus = Exclude<AttendanceStatus, 'unmarked'>;
export type Shift = 'morning' | 'evening';

export interface ShiftTimes {
  morningCutoff: string;
  eveningCutoff: string;
}

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
  marking: Shift | null;
  error: string | null;
  mark: (shift: Shift, status: MarkableAttendanceStatus) => Promise<void>;
}

export function getTodayString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function hasCutoffPassed(
  cutoffTime: string,
  date = new Date()
): boolean {
  const [hour, minute] = cutoffTime.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return true;
  const cutoff = new Date(date);
  cutoff.setHours(hour, minute, 0, 0);
  return date.getTime() >= cutoff.getTime();
}

const createDefaultAttendance = (): TodayAttendance => ({
  morning: { status: 'unmarked', markedAt: null, docId: null },
  evening: { status: 'unmarked', markedAt: null, docId: null },
});

const toIsoString = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return null;
};

export function useAttendance(
  communityId: string | null,
  shiftTimes: ShiftTimes | null
): UseAttendanceResult {
  const [attendance, setAttendance] = useState<TodayAttendance>(
    createDefaultAttendance
  );
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayString();
  const uid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!communityId || !uid) {
      setAttendance(createDefaultAttendance());
      setLoading(false);
      return;
    }

    let active = true;
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const morningId = `${communityId}_${uid}_${today}_morning`;
        const eveningId = `${communityId}_${uid}_${today}_evening`;
        const [morningSnap, eveningSnap] = await Promise.all([
          getDoc(doc(db, 'attendance', morningId)),
          getDoc(doc(db, 'attendance', eveningId)),
        ]);

        if (!active) return;
        const readShift = (
          snap: typeof morningSnap,
          docId: string
        ): ShiftAttendance => {
          if (!snap.exists()) return { status: 'unmarked', markedAt: null, docId };
          const data = snap.data();
          return {
            status: data.status ?? 'unmarked',
            markedAt: toIsoString(data.markedAt ?? data.updatedAt),
            docId,
          };
        };

        setAttendance({
          morning: readShift(morningSnap, morningId),
          evening: readShift(eveningSnap, eveningId),
        });
      } catch (err: any) {
        console.error('[useAttendance] fetch:', err);
        if (active) setError(err?.message ?? 'Failed to load attendance.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchAttendance();
    return () => {
      active = false;
    };
  }, [communityId, uid, today]);

  useEffect(() => {
    if (loading || !communityId || !uid || !shiftTimes) return;

    void (async () => {
      await syncAttendanceReminder({
        userId: uid,
        communityId,
        date: today,
        shift: 'morning',
        cutoffTime: shiftTimes.morningCutoff,
        status: attendance.morning.status,
      });
      await syncAttendanceReminder({
        userId: uid,
        communityId,
        date: today,
        shift: 'evening',
        cutoffTime: shiftTimes.eveningCutoff,
        status: attendance.evening.status,
      });
    })().catch((err) =>
      console.warn('[attendance reminders] scheduling failed:', err)
    );
  }, [attendance, communityId, loading, shiftTimes, today, uid]);

  const mark = useCallback(
    async (shift: Shift, status: MarkableAttendanceStatus) => {
      if (!communityId || !uid || !shiftTimes) return;

      const cutoffTime =
        shift === 'morning'
          ? shiftTimes.morningCutoff
          : shiftTimes.eveningCutoff;
      if (hasCutoffPassed(cutoffTime)) {
        setError(`The ${shift} attendance cutoff has passed.`);
        return;
      }

      setMarking(shift);
      setError(null);
      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        const userName = userSnap.exists() ? userSnap.data().name : 'Passenger';
        const markedAt = new Date().toISOString();
        const docId = `${communityId}_${uid}_${today}_${shift}`;
        const isNewRecord = attendance[shift].markedAt === null;

        await setDoc(
          doc(db, 'attendance', docId),
          {
            communityId,
            userId: uid,
            userName,
            date: today,
            shift,
            status,
            markedAt,
            updatedAt: markedAt,
            ...(isNewRecord ? { createdAt: markedAt } : {}),
          },
          { merge: true }
        );

        setAttendance((previous) => ({
          ...previous,
          [shift]: { status, markedAt, docId },
        }));

        void cancelAttendanceReminder({ userId: uid, date: today, shift }).catch(
          (err) => console.warn('[attendance reminders] cancellation failed:', err)
        );
      } catch (err: any) {
        console.error('[useAttendance] mark:', err);
        setError(err?.message ?? 'Failed to save attendance.');
      } finally {
        setMarking(null);
      }
    },
    [attendance, communityId, shiftTimes, today, uid]
  );

  return { attendance, loading, marking, error, mark };
}
