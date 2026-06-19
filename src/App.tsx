import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './pages/auth/LoginScreen';
import DriverHome from './pages/DriverHome';
import PassengerHome from './pages/PassengerHome';
import { PassengerAttendance } from './components/PassengerAttendance';

export type RootStackParamList = {
  Login: undefined;
  DriverHome: undefined;
  PassengerHome: undefined;
  AttendanceDashboard: { passengerId: string };
};


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AttendanceDashboard" component={PassengerAttendance as any} initialParams={{ passengerId: 'mock-user-1' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}