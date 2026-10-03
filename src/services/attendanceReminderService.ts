import * as Notifications from 'expo-notifications';
import type { Shift } from '@navigation/types';

export type ShiftStatus = 'present' | 'absent' | 'unmarked';

/**
 * Attendance cutoff per shift, "HH:mm" 24h. Driver-configurable shift times
 * were removed, so these are fixed. If PR #18 defines its own deadline,
 * import it here so reminders and the attendance screen always agree.
 */
export const SHIFT_CUTOFFS: Record<Shift, string> = {
  morning: '07:00',
  evening: '15:00',
};

const REMINDER_LEAD_MIN = 15;
const DAYS_AHEAD = 3;

export function dateKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function atTime(base: Date, hhmm: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const d = new Date(base);
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
}

function formatClock(d: Date) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export async function cancelAttendanceReminders() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.content.data?.type === 'attendance_reminder')
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Re-creates reminders from scratch. Called whenever membership or today's
 * attendance changes, so a marked shift is cancelled automatically.
 */
export async function scheduleAttendanceReminders(
  todayStatus: Record<Shift, ShiftStatus>,
) {
  await cancelAttendanceReminders();
  const now = new Date();

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);

    for (const shift of ['morning', 'evening'] as Shift[]) {
      // Today's shift already marked present/absent: no reminder.
      if (offset === 0 && todayStatus[shift] !== 'unmarked') continue;

      const cutoff = atTime(day, SHIFT_CUTOFFS[shift]);
      if (!cutoff) continue;
      const fireAt = new Date(cutoff.getTime() - REMINDER_LEAD_MIN * 60_000);
      if (fireAt.getTime() <= now.getTime()) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `attendance-${dateKey(day)}-${shift}`,
        content: {
          title: "Don't forget to mark your attendance",
          body: `${shift === 'morning' ? 'Morning' : 'Evening'} shift closes at ${formatClock(cutoff)}`,
          sound: 'default',
          data: { type: 'attendance_reminder', shift },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId: 'default',
        },
      });
    }
  }
}