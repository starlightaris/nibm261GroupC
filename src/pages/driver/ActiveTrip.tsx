import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { updateDriverLocation, stopDriverLocation } from '@services/locationService';
import { auth } from '../../../firebaseConfig';

export default function ActiveTripScreen() {
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  // Stop sharing if screen is closed
  useEffect(() => {
    return () => {
      watchSubscription.current?.remove();
    };
  }, []);

  const handleStartSharing = async () => {
    setLoading(true);

    // 1. Ask permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow location access to share your trip with passengers.'
      );
      setLoading(false);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Not logged in', 'Please log in first.');
      setLoading(false);
      return;
    }

    // 2. Get first location immediately so map shows right away
    const firstLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    setCurrentLocation({
      latitude: firstLocation.coords.latitude,
      longitude: firstLocation.coords.longitude,
    });

    // 3. Watch location — updates every 4 seconds or every 10 meters
    watchSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 4000,
        distanceInterval: 10,
      },
      (location) => {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading,
        };
        setCurrentLocation(coords);
        updateDriverLocation(uid, coords);
      }
    );

    setIsSharing(true);
    setLoading(false);
  };

  const handleStopSharing = async () => {
    watchSubscription.current?.remove();
    watchSubscription.current = null;
    setIsSharing(false);

    const uid = auth.currentUser?.uid;
    if (uid) await stopDriverLocation(uid);

    Alert.alert('Trip Ended', 'You have stopped sharing your location.');
  };

  return (
    <View style={styles.container}>

      {/* MAP */}
      {currentLocation ? (
        <MapView
          style={styles.map}
          region={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={currentLocation}
            title="You (Driver)"
            description="Your current location"
            pinColor="#6C63FF"
          />
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
          <Text style={styles.mapPlaceholderText}>
            Map will appear once you start the trip
          </Text>
        </View>
      )}

      {/* BOTTOM PANEL */}
      <View style={styles.panel}>

        {/* STATUS */}
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isSharing ? '#16a34a' : '#64748B' }
          ]} />
          <Text style={styles.statusText}>
            {isSharing
              ? 'Sharing your location with passengers'
              : 'Not sharing location'}
          </Text>
        </View>

        {/* COORDINATES (useful for testing) */}
        {currentLocation && (
          <Text style={styles.coords}>
            📍 {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
          </Text>
        )}

        {/* BUTTON */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#6C63FF"
            style={{ marginTop: 16 }}
          />
        ) : !isSharing ? (
          <TouchableOpacity style={styles.btnStart} onPress={handleStartSharing}>
            <Text style={styles.btnText}>🚀 Start Trip</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnStop} onPress={handleStopSharing}>
            <Text style={styles.btnText}>⏹ End Trip</Text>
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141E30',
  },
  mapPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapPlaceholderText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
  },
  panel: {
    backgroundColor: '#141E30',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1E2D45',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  coords: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 8,
  },
  btnStart: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  btnStop: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});