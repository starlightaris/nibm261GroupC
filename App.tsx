import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from '@navigation/RootNavigator';
import { navigationRef } from '@navigation/navigationRef';
import NotificationBootstrap from '@components/common/NotificationBootstrap';

// Keep the native splash up until RootNavigator says we're ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <NotificationBootstrap />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}