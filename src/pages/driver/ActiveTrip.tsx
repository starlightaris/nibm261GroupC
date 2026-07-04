import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { subscribeToWaitingPassengers } from '../../services/tripService';
import { useNearbyPassengerPreview } from '../../hooks/useNearbyPassengerPreview';
import PassengerPreviewDrawer from '@pages/passenger/PassengerPreviewDrawer';
import { PassengerPreview } from '../../types/trip';

// Replace with your team's real tripId source (route params, context, etc.)
const tripId = 'CURRENT_TRIP_ID';

export default function ActiveTripScreen() {
  const [passengers, setPassengers] = useState<PassengerPreview[]>([]);
  // Replace with your team's real GPS location hook/context
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const unsub = subscribeToWaitingPassengers(tripId, setPassengers);
    return unsub;
  }, []);

  const { visible, nearbyPassengers, dismiss } = useNearbyPassengerPreview(
    driverLocation,
    passengers
  );

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {/* Your team's map view component goes here, untouched */}
      <Text>Active Trip</Text>

      <PassengerPreviewDrawer
        visible={visible}
        passengers={nearbyPassengers}
        onDismiss={dismiss}
      />
    </View>
  );
}