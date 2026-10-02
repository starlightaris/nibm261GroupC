import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '@hooks/useAuth';
import { usePassengerCommunity } from '@hooks/usePassengerCommunity';
import {
  ShiftStatus, cancelAttendanceReminders, dateKey, scheduleAttendanceReminders,
} from '@services/attendanceReminderService';
import type { Shift } from '@navigation/types';

export function useAttendanceReminders() {
  const { user } = useAuth();
  const { community } = usePassengerCommunity();
  const [status, setStatus] = useState<Record<Shift, ShiftStatus>>({
    morning: 'unmarked',
    evening: 'unmarked',
  });
  const [today, setToday] = useState(() => dateKey(new Date()));

  const uid = user?.uid;
  const isPassenger = user?.role === 'passenger';
  const communityId = community?.communityId;

  // Roll the date over when the app returns to the foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setToday(dateKey(new Date()));
    });
    return () => sub.remove();
  }, []);

  // This passenger's attendance for today
  useEffect(() => {
    if (!isPassenger || !communityId || !uid) return;
    const q = query(
      collection(db, 'attendance'),
      where('communityId', '==', communityId),
      where('date', '==', today),
      where('userId', '==', uid),
    );
    return onSnapshot(
      q,
      (snap) => {
        const next: Record<Shift, ShiftStatus> = { morning: 'unmarked', evening: 'unmarked' };
        snap.docs.forEach((d) => {
          const r = d.data() as { shift?: string; status?: string };
          if (r.shift !== 'morning' && r.shift !== 'evening') return;
          if (r.status === 'present' || r.status === 'absent') next[r.shift] = r.status;
        });
        setStatus(next);
      },
      (err) => console.warn('[reminders] attendance read failed', err),
    );
  }, [isPassenger, communityId, uid, today]);

  // (Re)schedule whenever membership or today's attendance changes
  useEffect(() => {
    if (!isPassenger) return;
    if (!communityId) {
      cancelAttendanceReminders().catch(() => {});
      return;
    }
    scheduleAttendanceReminders(status).catch((e) =>
      console.warn('[reminders] schedule failed', e),
    );
  }, [isPassenger, communityId, status, today]);
}