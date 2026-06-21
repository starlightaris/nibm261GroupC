import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsHome    from '@pages/settings/SettingsHome';
import EditProfile     from '@pages/settings/EditProfile';
import VehicleDetails  from '@pages/settings/VehicleDetails';
import ShiftTimes      from '@pages/settings/ShiftTimes';
import NotifPrefs      from '@pages/settings/NotificationPrefs';
import TripHistory     from '@pages/settings/TripHistory';

import type { SettingsStackParams } from '@navigation/types';

const Stack = createNativeStackNavigator<SettingsStackParams>();

export default function DriverSettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitle:     '',
        headerTintColor:     '#1D4ED8',
        headerTitleStyle:    { fontSize: 16, fontWeight: '600', color: '#0F172A' },
        headerStyle:         { backgroundColor: '#FFFFFF' },
        headerShadowVisible: false,
        contentStyle:        { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="SettingsHome"            component={SettingsHome}   options={{ title: 'Settings' }} />
      <Stack.Screen name="EditProfile"             component={EditProfile}    options={{ title: 'Edit profile' }} />
      <Stack.Screen name="VehicleDetails"          component={VehicleDetails} options={{ title: 'Vehicle details' }} />
      <Stack.Screen name="ShiftTimes"              component={ShiftTimes}     options={{ title: 'Shift times' }} />
      <Stack.Screen name="NotificationPreferences" component={NotifPrefs}     options={{ title: 'Notifications' }} />
      <Stack.Screen name="TripHistory"             component={TripHistory}    options={{ title: 'Trip history' }} />
    </Stack.Navigator>
  );
}