import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsHome  from '@pages/settings/SettingsHome';
import EditProfile   from '@pages/settings/EditProfile';
import EditLocations from '@pages/settings/EditLocations';
import NotifPrefs    from '@pages/settings/NotificationPrefs';
import TripHistory   from '@pages/settings/TripHistory';

import type { SettingsStackParams } from '@navigation/types';

const Stack = createNativeStackNavigator<SettingsStackParams>();

export default function PassengerSettingsStack() {
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
      <Stack.Screen name="SettingsHome"            component={SettingsHome}  options={{ title: 'Settings' }} />
      <Stack.Screen name="EditProfile"             component={EditProfile}   options={{ title: 'Edit profile' }} />
      <Stack.Screen name="EditLocations"           component={EditLocations} options={{ title: 'My locations' }} />
      <Stack.Screen name="NotificationPreferences" component={NotifPrefs}    options={{ title: 'Notifications' }} />
      <Stack.Screen name="TripHistory"             component={TripHistory}   options={{ title: 'Trip history' }} />
    </Stack.Navigator>
  );
}