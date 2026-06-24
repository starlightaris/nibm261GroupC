import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import Login         from '@pages/auth/Login';
import PassengerSignUp       from '@pages/auth/PassengerSignUp';
import DriverSignUpDetails   from '@pages/auth/DriverSignUpDetails';
import DriverSignUpBus       from '@pages/auth/DriverSignUpBus';

// Tab navigators
import DriverTabs    from '@navigation/DriverTabs';
import PassengerTabs from '@navigation/PassengerTabs';

// Full screen (above tabs — hides bottom nav)
import ActiveTrip from '@pages/driver/ActiveTrip';

import type { AuthStackParams, RootStackParams } from '@navigation/types';


const Auth = createNativeStackNavigator<AuthStackParams>();
const Root = createNativeStackNavigator<RootStackParams>();

// ─── Temporary: hardcode role to test layout ──────────────────────────────────
// Replace this with useAuth() from Firebase once auth is wired up.
// Change to 'passenger' to test passenger tabs. null for login page
const MOCK_ROLE: 'driver' | 'passenger' | null = 'passenger';
const MOCK_LOADING = false;

function AuthNavigator() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login"               component={Login} />
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