import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider }    from 'react-native-safe-area-context';
import RootNavigator           from '@navigation/RootNavigator';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  initializeAttendanceNotifications,
  isAttendanceReminderResponse,
} from '@services/attendanceNotificationService';
import {
  flushPendingNavigation,
  navigationRef,
  openPassengerHome,
} from '@navigation/navigationRef';

export default function App() {
  useEffect(() => {
    void initializeAttendanceNotifications().catch((error) =>
      console.warn('[notifications] initialization failed:', error)
    );

    if (Platform.OS === 'web') return;

    const openReminder = (response: Notifications.NotificationResponse) => {
      if (isAttendanceReminderResponse(response)) openPassengerHome();
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(openReminder);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && isAttendanceReminderResponse(response)) {
        openPassengerHome();
        void Notifications.clearLastNotificationResponseAsync();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
