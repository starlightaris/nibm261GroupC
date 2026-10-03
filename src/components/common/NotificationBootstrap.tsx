import { useNotifications } from '@hooks/useNotifications';
import { useAttendanceReminders } from '@hooks/useAttendanceReminders';

/** Mounted once inside NavigationContainer. Renders nothing. */
export default function NotificationBootstrap() {
  useNotifications();
  useAttendanceReminders(); // no-op for drivers
  return null;
}