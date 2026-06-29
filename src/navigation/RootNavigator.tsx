import React                          from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth }                    from '../../App';
import { RootStackParams }            from './types';

// Auth screens — your files
import Login               from '../pages/auth/Login';
import PassengerSignUp     from '../pages/auth/PassengerSignUp';
import DriverSignUpDetails from '../pages/auth/DriverSignUpDetails';
import DriverSignUpBus     from '../pages/auth/DriverSignUpBus';


import DriverTabs    from './DriverTabs';
import PassengerTabs from './PassengerTabs';

const Stack = createNativeStackNavigator<RootStackParams>();
const DRIVER_ROLE = 'driver' as const;
const PASSENGER_ROLE = 'passenger' as const;

export default function RootNavigator() {
  const { user } = useAuth();
  const role = user?.role;
  const isDriver = role === DRIVER_ROLE;
  const isPassenger = role === PASSENGER_ROLE;

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login"               component={Login} />
        <Stack.Screen name="PassengerSignUp"     component={PassengerSignUp} />
        <Stack.Screen name="DriverSignUpDetails" component={DriverSignUpDetails} />
        <Stack.Screen name="DriverSignUpBus"     component={DriverSignUpBus} />
      </Stack.Navigator>
    );
  }

  if (isDriver) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DriverTabs" component={DriverTabs} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
    </Stack.Navigator>
  );
}