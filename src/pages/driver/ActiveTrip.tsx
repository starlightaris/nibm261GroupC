import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useActiveTrip } from '@hooks/useActiveTrip';
import type { RootStackParams } from '@navigation/types';
import { useRouteDirections, LatLng } from '@hooks/useRouteDirections';
import { RouteStop, Shift } from '@hooks/useDriverRoute';
import { Colors, Radius, Spacing } from '@styles/tokens';
import NextStopCard from '@components/driver/activetrip/NextStopCard';
import PassengerQueue from '@components/driver/activetrip/PassengerQueue';
import TripCompleteCard from '@components/driver/activetrip/TripCompleteCard';

// ─── Nav params ───────────────────────────────────────────────────────────────

// Navigation types — RootStackParams is the source of truth
type ActiveTripNavProp = NativeStackNavigationProp<RootStackParams, 'ActiveTrip'>;
type ActiveTripRouteProp = RouteProp<RootStackParams, 'ActiveTrip'>;


// ─── API key from app.json ────────────────────────────────────────────────────

const MAPS_API_KEY: string =
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey ??
  Constants.expoConfig?.ios?.config?.googleMapsApiKey ??
  '';

// ─── Map region helper ────────────────────────────────────────────────────────

function regionFromLatLng(coord: LatLng, delta = 0.015) {
  return { ...coord, latitudeDelta: delta, longitudeDelta: delta };
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </SafeAreaView>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <SafeAreaView style={styles.centered}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>Go back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ActiveTripScreen() {
  const navigation = useNavigation<ActiveTripNavProp>();
  const route = useRoute<ActiveTripRouteProp>();
  const { stops, shift, communityId } = route.params;

  const mapRef = useRef<MapView>(null);

  // ── Trip state ──────────────────────────────────────────────────────────────
  const { trip, loading: tripLoading, error: tripError, startTrip, markPickedUp, endTrip } =
    useActiveTrip();

  // ── Directions ──────────────────────────────────────────────────────────────
  const {
    fullPolyline,
    nextInstruction,
    nextEta,
    driverLocation,
    loading: dirLoading,
    refresh: refreshDirections,
  } = useRouteDirections({
    remainingStops: trip.remainingStops,
    apiKey: MAPS_API_KEY,
    enabled: trip.status === 'active',
  });

  // ── Start trip on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    startTrip({ stops, shift, communityId });
  }, []);

  // ── Re-centre map on next stop or driver location change ────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const target = driverLocation ?? trip.nextStop?.pickupLocation ?? null;
    if (!target) return;
    mapRef.current.animateToRegion(regionFromLatLng(target), 600);
  }, [trip.currentStopIndex, driverLocation]);

  // ── Mark picked up + refresh directions ────────────────────────────────────
  const handleMarkPickedUp = async () => {
    await markPickedUp();
    refreshDirections();
  };

  // ── End trip ───────────────────────────────────────────────────────────────
  const handleDone = async () => {
    await endTrip();
    navigation.goBack();
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (tripLoading && trip.status === 'pending') {
    return <LoadingScreen message="Starting trip…" />;
  }
  if (tripError) {
    return <ErrorScreen message={tripError} onBack={() => navigation.goBack()} />;
  }

  const isComplete   = trip.status === 'completed';
  const initialRegion = trip.nextStop
    ? regionFromLatLng(trip.nextStop.pickupLocation)
    : { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* ── Floating back button ─────────────────────────────────────────── */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>‹  Route</Text>
      </TouchableOpacity>

      {/* ── Progress pill ────────────────────────────────────────────────── */}
      <View style={styles.progressPill}>
        <Text style={styles.progressText}>
          {isComplete
            ? `All ${trip.allStops.length} picked up`
            : `${trip.currentStopIndex} / ${trip.allStops.length} picked up`}
        </Text>
      </View>

      {/* ── Directions loading indicator (subtle, top-right) ─────────────── */}
      {dirLoading && (
        <View style={styles.dirLoadingBadge}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.dirLoadingText}>Routing…</Text>
        </View>
      )}

      {/* ── Full-screen map ──────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsTraffic
        followsUserLocation={!isComplete}
      >
        {/* Real Directions API polyline — replaces straight dashed line */}
        {fullPolyline.length > 1 && (
          <Polyline
            coordinates={fullPolyline}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}

        {/* Fallback straight-line polyline if directions haven't loaded yet */}
        {fullPolyline.length === 0 && trip.remainingStops.length > 1 && (
          <Polyline
            coordinates={trip.remainingStops.map((s) => s.pickupLocation)}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}

        {/* Remaining stop markers */}
        {trip.remainingStops.map((stop, i) => (
          <Marker
            key={`rem-${stop.userId}`}
            coordinate={stop.pickupLocation}
            title={stop.name}
            description={i === 0 ? nextEta ?? 'Next stop' : undefined}
          >
            <View style={styles.markerWrap}>
              <View style={[styles.marker, i === 0 && styles.markerNext]}>
                <Text style={styles.markerText}>{trip.currentStopIndex + i + 1}</Text>
              </View>
              <View style={[styles.markerTail, i === 0 && styles.markerTailNext]} />
            </View>
          </Marker>
        ))}

        {/* Completed stop markers */}
        {trip.completedStops.map((stop) => (
          <Marker key={`done-${stop.userId}`} coordinate={stop.pickupLocation}>
            <View style={styles.markerDone}>
              <Text style={styles.markerDoneText}>✓</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Bottom sheet ─────────────────────────────────────────────────── */}
      <View style={styles.sheet}>
        {isComplete ? (
          <TripCompleteCard total={trip.allStops.length} onDone={handleDone} />
        ) : trip.nextStop ? (
          <NextStopCard
            stop={trip.nextStop}
            stopNumber={trip.currentStopIndex + 1}
            total={trip.allStops.length}
            eta={nextEta}
            nextInstruction={nextInstruction}
            onMarkPickedUp={handleMarkPickedUp}
            loading={tripLoading}
          />
        ) : null}

        <PassengerQueue
          allStops={trip.allStops}
          currentIndex={trip.currentStopIndex}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SHEET_HEIGHT = 280;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    padding: Spacing.xxl,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
  errorText:   { fontSize: 14, color: Colors.error, textAlign: 'center', marginBottom: 12 },
  backLink:    { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  // Map fills screen minus sheet height
  map: { flex: 1, marginBottom: SHEET_HEIGHT },

  // Floating back button
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 16,
    left: Spacing.lg,
    zIndex: 10,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  // Progress pill — centred top
  progressPill: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 16,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  progressText: { fontSize: 12, fontWeight: '700', color: Colors.white },

  // Directions loading — top right
  dirLoadingBadge: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 16,
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dirLoadingText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
  },

  // Markers
  markerWrap: { alignItems: 'center' },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  markerNext:     { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18 },
  markerText:     { color: Colors.white, fontSize: 12, fontWeight: '700' },
  markerTail: {
    width: 0, height: 0,
    borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: Colors.muted, marginTop: -1,
  },
  markerTailNext: { borderTopColor: Colors.primary },
  markerDone: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  markerDoneText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
});