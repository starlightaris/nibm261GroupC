import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { usePassengerTrack } from '@hooks/usePassengerTrack';
import EtaCard from '@components/passenger/track/EtaCard';
import StopHistoryCard from '@components/passenger/track/StopHistoryCard';
import NoBusCard from '@components/passenger/track/NoBusCard';
import { Colors, Spacing, Typography } from '@styles/tokens';

export default function TrackScreen() {
  const {
    busLocation,
    etaMinutes,
    recentStops,
    driverName,
    vehicleNickname,
    isSharing,
    loading,
    error,
  } = usePassengerTrack();

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Finding your bus...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* MAP — takes top half of screen */}
      <View style={styles.mapContainer}>
        {busLocation && isSharing ? (
          <MapView
            style={styles.map}
            region={{
              latitude: busLocation.latitude,
              longitude: busLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Moving bus marker */}
            <Marker
              coordinate={{
                latitude: busLocation.latitude,
                longitude: busLocation.longitude,
              }}
              title={vehicleNickname ?? 'Your Bus'}
              description={driverName ?? 'Driver'}
            >
              <View style={styles.busMarker}>
                <Text style={styles.busMarkerText}>🚐</Text>
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>🗺️</Text>
            <Text style={styles.mapPlaceholderLabel}>
              Map appears when bus is active
            </Text>
          </View>
        )}
      </View>

      {/* BOTTOM SCROLL PANEL */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}
        showsVerticalScrollIndicator={false}
      >
        {isSharing && busLocation ? (
          <>
            {/* ETA Card */}
            <EtaCard
              etaMinutes={etaMinutes}
              driverName={driverName}
              vehicleNickname={vehicleNickname}
            />

            {/* Recent Stops */}
            <StopHistoryCard stops={recentStops} />
          </>
        ) : (
          <NoBusCard />
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    padding: Spacing.xl,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
  },
  mapPlaceholderText: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  mapPlaceholderLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  busMarker: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  busMarkerText: {
    fontSize: 24,
  },
  panel: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  panelContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
});