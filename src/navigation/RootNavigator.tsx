import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import Login               from '../pages/auth/Login';
import RoleSelect          from '../pages/auth/RoleSelect';
import PassengerSignUp     from '../pages/auth/PassengerSignUp';
import DriverSignUpDetails from '../pages/auth/DriverSignUpDetails';
import DriverSignUpBus     from '../pages/auth/DriverSignUpBus';

// Tab navigators
import DriverTabs    from './DriverTabs';
import PassengerTabs from './PassengerTabs';

// Full screen
import ActiveTrip from '../pages/driver/ActiveTrip';

import type { AuthStackParams, RootStackParams } from './types';

const Auth = createNativeStackNavigator<AuthStackParams>();
const Root = createNativeStackNavigator<RootStackParams>();

const MOCK_ROLE: 'driver' | 'passenger' | null = null;
const MOCK_LOADING = false;

function AuthNavigator() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login"               component={Login} />
      <Auth.Screen name="RoleSelect"          component={RoleSelect} />
      <Auth.Screen name="PassengerSignUp"     component={PassengerSignUp} />
      <Auth.Screen name="DriverSignUpDetails" component={DriverSignUpDetails} />
      <Auth.Screen name="DriverSignUpBus"     component={DriverSignUpBus} />
    </Auth.Navigator>
  );
}

function DriverNavigator() {
  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      <Root.Screen name="DriverTabs" component={DriverTabs} />
      <Root.Screen
        name="ActiveTrip"
        component={ActiveTrip}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Root.Navigator>
  );
}

export default function RootNavigator() {
  if (MOCK_LOADING) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }
  if (!MOCK_ROLE) return <AuthNavigator />;
  return MOCK_ROLE === 'driver'
    ? <DriverNavigator />
    : <PassengerTabs />;
}