import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useActiveTrip } from '@hooks/useActiveTrip';
import { RouteStop, Shift } from '@hooks/useDriverRoute';
import { Colors, Radius, Spacing } from '@styles/tokens';

// Nav params

type ActiveTripParams = {
  ActiveTrip: {
    stops: RouteStop[];
    shift: Shift;
    communityId: string;
  };
};

// Sub-components

function InitialsAvatar({
  initials,
  size = 48,
  done = false,
}: {
  initials: string;
  size?: number;
  done?: boolean;
}) {
  return (
    <View
      style={[
        avatarStyles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        done && avatarStyles.done,
      ]}
    >
      <Text style={[avatarStyles.text, { fontSize: size * 0.35 }, done && avatarStyles.doneText]}>
        {initials}
      </Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: { backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  done:   { backgroundColor: Colors.border },
  text:   { fontWeight: '700', color: Colors.primary },
  doneText: { color: Colors.muted },
});

// Next stop card

function NextStopCard({
  stop,
  stopNumber,
  total,
  onMarkPickedUp,
  loading,
}: {
  stop: RouteStop;
  stopNumber: number;
  total: number;
  onMarkPickedUp: () => void;
  loading: boolean;
}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.meta}>
        <Text style={cardStyles.eyebrow}>Next stop  ·  {stopNumber} of {total}</Text>
      </View>

      <View style={cardStyles.row}>
        <InitialsAvatar initials={stop.initials} size={52} />
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{stop.name}</Text>
          <Text style={cardStyles.coords}>
            {stop.pickupLocation.latitude.toFixed(5)}, {stop.pickupLocation.longitude.toFixed(5)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[cardStyles.btn, loading && cardStyles.btnDisabled]}
        onPress={onMarkPickedUp}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Text style={cardStyles.btnText}>Mark as Picked Up  ✓</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  meta:   { marginBottom: Spacing.md },
  eyebrow: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
             textTransform: 'uppercase', letterSpacing: 0.8 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  info:   { flex: 1 },
  name:   { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  coords: { fontSize: 11, color: Colors.muted },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});

// Passenger queue strip

function PassengerQueue({
  allStops,
  currentIndex,
}: {
  allStops: RouteStop[];
  currentIndex: number;
}) {
  return (
    <View style={queueStyles.wrapper}>
      <Text style={queueStyles.label}>Passengers</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={queueStyles.strip}>
        {allStops.map((stop, i) => {
          const isDone = i < currentIndex;
          const isNext = i === currentIndex;
          return (
            <View key={stop.userId} style={queueStyles.item}>
              <View style={[queueStyles.ring, isNext && queueStyles.ringActive, isDone && queueStyles.ringDone]}>
                <InitialsAvatar initials={stop.initials} size={36} done={isDone} />
              </View>
              <Text style={[queueStyles.name, isDone && queueStyles.nameDone]} numberOfLines={1}>
                {stop.name.split(' ')[0]}
              </Text>
              {isDone && <Text style={queueStyles.tick}>✓</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const queueStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  label: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginLeft: Spacing.lg, marginBottom: Spacing.sm,
  },
  strip: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  item:  { alignItems: 'center', width: 52 },
  ring: {
    borderRadius: 22, borderWidth: 2,
    borderColor: Colors.border, padding: 1, marginBottom: 4,
  },
  ringActive: { borderColor: Colors.primary },
  ringDone:   { borderColor: Colors.success },
  name:     { fontSize: 10, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  nameDone: { color: Colors.muted },
  tick:     { fontSize: 10, color: Colors.success, fontWeight: '700' },
});

// Trip complete card

function TripCompleteCard({ total, onDone }: { total: number; onDone: () => void }) {
  return (
    <View style={doneStyles.card}>
      <Text style={doneStyles.icon}>🎉</Text>
      <Text style={doneStyles.title}>Trip complete</Text>
      <Text style={doneStyles.body}>All {total} passengers picked up.</Text>
      <TouchableOpacity style={doneStyles.btn} onPress={onDone} activeOpacity={0.85}>
        <Text style={doneStyles.btnText}>Back to Route</Text>
      </TouchableOpacity>
    </View>
  );
}

const doneStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.card,
    padding: Spacing.xxl, marginHorizontal: Spacing.lg,
    alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  icon:  { fontSize: 40, marginBottom: Spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  body:  { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xl },
  btn:   { backgroundColor: Colors.primary, borderRadius: Radius.button,
           paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});

// Map helpers

function getRegion(stops: RouteStop[], currentIndex: number) {
  const target = stops[currentIndex] ?? stops[0];
  if (!target) return { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  return { ...target.pickupLocation, latitudeDelta: 0.015, longitudeDelta: 0.015 };
}

// Screen

export default function ActiveTripScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<ActiveTripParams, 'ActiveTrip'>>();
  const { stops, shift, communityId } = route.params;

  const mapRef = useRef<MapView>(null);
  const { trip, loading, error, startTrip, markPickedUp, endTrip } = useActiveTrip();

  // Start trip on mount
  useEffect(() => {
    startTrip({ stops, shift, communityId });
  }, []);

  // Re-centre map when next stop changes
  useEffect(() => {
    if (!trip.nextStop || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { ...trip.nextStop.pickupLocation, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      600
    );
  }, [trip.currentStopIndex]);

  const handleDone = async () => {
    await endTrip();
    navigation.goBack();
  };

  // Loading / error
  if (loading && trip.status === 'pending') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Starting trip…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isComplete = trip.status === 'completed';
  const region     = getRegion(trip.allStops, trip.currentStopIndex);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Back button — floats over map */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>‹  Route</Text>
      </TouchableOpacity>

      {/* Progress pill */}
      <View style={styles.progressPill}>
        <Text style={styles.progressText}>
          {isComplete
            ? `All ${trip.allStops.length} picked up`
            : `${trip.currentStopIndex} / ${trip.allStops.length} picked up`}
        </Text>
      </View>

      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={!isComplete}
      >
        {/* Remaining stop markers */}
        {trip.remainingStops.map((stop, i) => (
          <Marker
            key={`rem-${stop.userId}`}
            coordinate={stop.pickupLocation}
            title={stop.name}
          >
            <View style={styles.markerWrap}>
              <View style={[styles.marker, i === 0 && styles.markerNext]}>
                <Text style={styles.markerText}>{trip.currentStopIndex + i + 1}</Text>
              </View>
              <View style={[styles.markerTail, i === 0 && styles.markerTailNext]} />
            </View>
          </Marker>
        ))}

        {/* Completed stop markers — ghost */}
        {trip.completedStops.map((stop) => (
          <Marker key={`done-${stop.userId}`} coordinate={stop.pickupLocation}>
            <View style={styles.markerDone}>
              <Text style={styles.markerDoneText}>✓</Text>
            </View>
          </Marker>
        ))}

        {/* Dashed polyline through remaining stops */}
        {trip.remainingStops.length > 1 && (
          <Polyline
            coordinates={trip.remainingStops.map((s) => s.pickupLocation)}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}
      </MapView>

      {/* Bottom sheet overlay */}
      <View style={styles.sheet}>
        {isComplete ? (
          <TripCompleteCard total={trip.allStops.length} onDone={handleDone} />
        ) : trip.nextStop ? (
          <NextStopCard
            stop={trip.nextStop}
            stopNumber={trip.currentStopIndex + 1}
            total={trip.allStops.length}
            onMarkPickedUp={markPickedUp}
            loading={loading}
          />
        ) : null}

        <PassengerQueue allStops={trip.allStops} currentIndex={trip.currentStopIndex} />
      </View>
    </SafeAreaView>
  );
}

// Styles

const SHEET_HEIGHT = 260;

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center',
              backgroundColor: Colors.bg, padding: Spacing.xxl },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
  errorText:   { fontSize: 14, color: Colors.error, textAlign: 'center', marginBottom: 12 },
  backLink:    { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  map: { flex: 1, marginBottom: SHEET_HEIGHT },

  backBtn: {
    position: 'absolute', top: Platform.OS === 'android' ? 48 : 16,
    left: Spacing.lg, zIndex: 10,
    backgroundColor: Colors.white, borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 8,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  progressPill: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 16,
    alignSelf: 'center', zIndex: 10,
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  progressText: { fontSize: 12, fontWeight: '700', color: Colors.white },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SHEET_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
  },

  markerWrap: { alignItems: 'center' },
  marker: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.muted, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: Colors.white,
  },
  markerNext: { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18 },
  markerText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  markerTail: {
    width: 0, height: 0,
    borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: Colors.muted, marginTop: -1,
  },
  markerTailNext: { borderTopColor: Colors.primary },
  markerDone: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
  },
  markerDoneText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
});