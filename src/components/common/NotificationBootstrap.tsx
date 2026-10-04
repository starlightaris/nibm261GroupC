import { useNotifications } from '@hooks/useNotifications';

/** Mounted once inside NavigationContainer. Renders nothing. */
export default function NotificationBootstrap() {
  useNotifications();
  return null;
}
