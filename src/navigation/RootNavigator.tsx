import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

import Login               from '@pages/auth/Login';
import PassengerSignUp     from '@pages/auth/PassengerSignUp';
import DriverSignUpDetails from '@pages/auth/DriverSignUpDetails';
import DriverSignUpBus     from '@pages/auth/DriverSignUpBus';

import DriverTabs    from '@navigation/DriverTabs';
import PassengerTabs from '@navigation/PassengerTabs';
import ActiveTrip    from '@pages/driver/ActiveTrip';

import type {
  AuthStackParams,
  RootStackParams,
  PassengerRootParams,
} from '@navigation/types';
import type { UserRole } from '../types/auth';

const Auth          = createNativeStackNavigator<AuthStackParams>();
const DriverRoot    = createNativeStackNavigator<RootStackParams>();
const PassengerRoot = createNativeStackNavigator<PassengerRootParams>();

// ─── Auth ─────────────────────────────────────────────────────────────────────

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

// ─── Driver (tabs + ActiveTrip full-screen above tabs) ────────────────────────

function DriverNavigator() {
  return (
    <DriverRoot.Navigator screenOptions={{ headerShown: false }}>
      <DriverRoot.Screen name="DriverTabs" component={DriverTabs} />
      <DriverRoot.Screen
        name="ActiveTrip"
        component={ActiveTrip}
        options={{ animation: 'slide_from_bottom' }}
      />
    </DriverRoot.Navigator>
  );
}

// ─── Passenger (tabs only) ────────────────────────────────────────────────────

function PassengerNavigator() {
  return (
    <PassengerRoot.Navigator screenOptions={{ headerShown: false }}>
      <PassengerRoot.Screen name="PassengerTabs" component={PassengerTabs} />
    </PassengerRoot.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RootNavigator() {
  const [role, setRole]       = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        setRole(snap.exists() ? (snap.data().role as UserRole) : null);
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (role === 'driver')    return <DriverNavigator />;
  if (role === 'passenger') return <PassengerNavigator />;
  return <AuthNavigator />;
}