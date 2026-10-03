import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import * as SplashScreen from 'expo-splash-screen';
import { auth, db } from '../../firebaseConfig';

import Login               from '@pages/auth/Login';
import RoleSelect          from '@pages/auth/RoleSelect';
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

// Minimum time the splash stays visible, however fast auth resolves.
const MIN_SPLASH_MS = 1500;

function AuthNavigator() {
  return (
    <Auth.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
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

function PassengerNavigator() {
  return (
    <PassengerRoot.Navigator screenOptions={{ headerShown: false }}>
      <PassengerRoot.Screen name="PassengerTabs" component={PassengerTabs} />
    </PassengerRoot.Navigator>
  );
}

export default function RootNavigator() {
  const [role,       setRole]       = useState<UserRole | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);

  // Minimum splash duration
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // Resolve Firebase auth and role in the background while the splash is visible
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

  const ready = !loading && minElapsed;

  // Hide the native splash only when auth is resolved AND 1.5 s has passed
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Native splash still covers the screen. Rendering nothing prevents a Login flash.
  if (!ready) return null;

  if (role === 'driver')    return <DriverNavigator />;
  if (role === 'passenger') return <PassengerNavigator />;
  return <AuthNavigator />;
}