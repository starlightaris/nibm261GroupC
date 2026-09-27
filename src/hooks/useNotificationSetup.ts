import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  savePushTokenForCurrentUser,
} from '@services/notificationService';


export function useNotificationSetup(enabled: boolean) {
  const receivedSub = useRef<Notifications.EventSubscription | null>(null);
  const responseSub = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    registerForPushNotificationsAsync().then((token) => {
      if (token && !cancelled) {
        savePushTokenForCurrentUser(token);
      }
    });

    
    receivedSub.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[notifications] received:', notification.request.content.title);
    });

    
    responseSub.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[notifications] tapped:', data);
      
    });

    return () => {
      cancelled = true;
      receivedSub.current?.remove();
      responseSub.current?.remove();
    };
  }, [enabled]);
}