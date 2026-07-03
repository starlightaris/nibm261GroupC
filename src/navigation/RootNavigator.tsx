import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@config/firebaseConfig';

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
  const [role,    setRole]    = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        let userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        let userData = userDocSnap.exists() ? userDocSnap.data() : null;
        let userRole = userData?.role?.toLowerCase()?.trim();

        // Fallback: Check if they are in the 'passengers' collection
        if (!userData) {
          const passengerSnap = await getDoc(doc(db, 'passengers', firebaseUser.uid));
          if (passengerSnap.exists()) {
            userData = passengerSnap.data();
            userRole = 'passenger';
            console.log("Found user in 'passengers' fallback collection.");
          }
        }

        // Fallback: Check if they are in the 'vehicles' collection (which acts as drivers)
        if (!userData) {
          const vehicleSnap = await getDoc(doc(db, 'vehicles', firebaseUser.uid));
          if (vehicleSnap.exists()) {
            userData = vehicleSnap.data();
            userRole = 'driver';
            console.log("Found user in 'vehicles' fallback collection.");
          }
        }

        if (userRole === 'passenger' || userRole === 'driver') {
          setRole(userRole as UserRole);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Error loading user role:', err);
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