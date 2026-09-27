import { useEffect } from 'react';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import {
  scheduleLocalNotification,
  cancelScheduledNotification,
} from '@services/notificationService';
import { useNotificationPrefs } from '@hooks/useNotificationPrefs';

const REMINDER_ID = 'attendance-reminder';


const REMINDER_HOUR = 8;
const REMINDER_MINUTE = 30;


export function useAttendanceReminder() {
  const { prefs, loading } = useNotificationPrefs();

  useEffect(() => {
    if (loading) return;

    (async () => {
      if (!prefs.attendanceReminder) {
        await cancelScheduledNotification(REMINDER_ID);
        return;
      }

      await scheduleLocalNotification(
        REMINDER_ID,
        'Mark your attendance',
        "Don't forget to confirm whether you're riding today before the cutoff time.",
        {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: REMINDER_HOUR,
          minute: REMINDER_MINUTE,
        },
        { type: 'ATTENDANCE_REMINDER' }
      );
    })();
  }, [prefs.attendanceReminder, loading]);
}