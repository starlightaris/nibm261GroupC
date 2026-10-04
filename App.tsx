import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider }    from 'react-native-safe-area-context';
import RootNavigator           from '@navigation/RootNavigator';
import { navigationRef }       from '@navigation/navigationRef';
import NotificationBootstrap   from '@components/common/NotificationBootstrap';
import React from 'react';

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
