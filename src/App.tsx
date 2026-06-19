import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverHome from './pages/DriverHome';
import PassengerHome from './pages/PassengerHome';
import { Attendance as PassengerAttendance } from './pages/passenger/Attendance';

export type RootStackParamList = {
  DriverHome: undefined;
  PassengerHome: undefined;
  AttendanceDashboard: { passengerId: string };
};


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AttendanceDashboard"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="AttendanceDashboard" component={PassengerAttendance as any} initialParams={{ passengerId: 'mock-user-1' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}