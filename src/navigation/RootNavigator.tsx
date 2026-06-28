import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@config/firebaseConfig';

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

type UserRole = 'passenger' | 'driver' | null;

export default function RootNavigator() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setError(null);

      try {
        if (!user) {
          setRole(null);
          return;
        }

        let userDocSnap = await getDoc(doc(db, 'users', user.uid));
        let userData = userDocSnap.exists() ? userDocSnap.data() : null;
        let userRole = userData?.role?.toLowerCase()?.trim();

        // Fallback: Check if they are in the 'passengers' collection
        if (!userData) {
          const passengerSnap = await getDoc(doc(db, 'passengers', user.uid));
          if (passengerSnap.exists()) {
            userData = passengerSnap.data();
            userRole = 'passenger';
            console.log("Found user in 'passengers' fallback collection.");
          }
        }

        // Fallback: Check if they are in the 'vehicles' collection (which acts as drivers)
        if (!userData) {
          const vehicleSnap = await getDoc(doc(db, 'vehicles', user.uid));
          if (vehicleSnap.exists()) {
            userData = vehicleSnap.data();
            userRole = 'driver';
            console.log("Found user in 'vehicles' fallback collection.");
          }
        }

        if (!userData) {
          setRole(null);
          setError('User profile not found in any collection.');
          console.warn("User not found in users, passengers, or vehicles collections!");
          return;
        }

        console.log("Normalized userRole:", userRole);

        if (userRole === 'passenger' || userRole === 'driver') {
          setRole(userRole);
        } else {
          setRole(null);
          setError('Invalid user role.');
        }
      } catch (err) {
        console.error('Error loading user role:', err);
        setRole(null);
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!role) {
    // If there is an error but no role, we still show AuthNavigator 
    // The user might be prompted or can just sign in again
    return <AuthNavigator />;
  }

  if (role === 'passenger') {
    return <PassengerTabs />;
  }

  if (role === 'driver') {
    return <DriverNavigator />;
  }

  return <AuthNavigator />;
}