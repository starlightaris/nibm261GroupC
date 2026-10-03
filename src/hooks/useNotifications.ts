import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@hooks/useAuth';
import { registerForPushNotifications } from '@services/notificationService';
import { navigationRef } from '@navigation/navigationRef';

function routeFromNotification(response: Notifications.NotificationResponse, attempt = 0) {
  const type = response.notification.request.content.data?.type;

  // On a cold start the navigator may not be mounted yet, so retry briefly.
  if (!navigationRef.isReady()) {
    if (attempt < 20) setTimeout(() => routeFromNotification(response, attempt + 1), 300);
    return;
  }
  const nav = navigationRef as any;

  if (type === 'attendance_reminder') {
    nav.navigate('PassengerTabs', { screen: 'PassengerHome' });
  } else if (type === 'driver_approaching') {
    nav.navigate('PassengerTabs', { screen: 'Track' });
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Register and keep the token fresh
  useEffect(() => {
    if (!uid) return;
    registerForPushNotifications(uid);
    const sub = Notifications.addPushTokenListener(() => {
      registerForPushNotifications(uid); // token changed, so re-save
    });
    return () => sub.remove();
  }, [uid]);

  // Tap handling (foreground/background) and cold start
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) =>
      routeFromNotification(r),
    );
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) routeFromNotification(r);
    });
    return () => sub.remove();
  }, []);
}