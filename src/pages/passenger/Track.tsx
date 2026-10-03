import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { usePassengerTrack } from '@hooks/usePassengerTrack';
import { Colors, Radius, Spacing, Typography } from '@styles/tokens';
import { formatDistance, formatEta } from '../../utils/eta';

export default function TrackScreen() {
  const {
    state,
    community,
    driverLocation,
    eta,
    pickedUp,
    secondsSinceUpdate,
    isStale,
    error,
  } = usePassengerTrack();

  const mapRef = useRef<MapView>(null);
  const fittedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  const pickup = community?.member.pickupLocation ?? null;

  // Frame driver + pickup once when the map first has a fix. After that the
  // passenger keeps control of pan/zoom; we don't fight their gestures.
  useEffect(() => {
    if (state !== 'live' || !driverLocation) {
      fittedRef.current = false;
      return;
    }
    if (!mapReady || fittedRef.current) return;

    const coords = [
      { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
      ...(pickup ? [{ latitude: pickup.latitude, longitude: pickup.longitude }] : []),
    ];
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 260, left: 60 },
      animated: true,
    });
    fittedRef.current = true;
  }, [state, driverLocation, pickup, mapReady]);

  // ── Non-map states ──────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Couldn't load your trip</Text>
        <Text style={styles.emptyBody}>{error ?? 'Please try again in a moment.'}</Text>
      </View>
    );
  }

  if (state === 'no-community') {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No community yet</Text>
        <Text style={styles.emptyBody}>
          Join your driver's community from the Home tab to track your bus.
        </Text>
      </View>
    );
  }

  if (state === 'waiting') {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🚌</Text>
        <Text style={styles.emptyTitle}>Your driver hasn't started yet</Text>
        <Text style={styles.emptyBody}>
          {community?.driverName ?? 'Your driver'} hasn't started today's trip. This
          screen will update on its own as soon as they do.
        </Text>
      </View>
    );
  }

  if (state === 'locating' || !driverLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.emptyTitle, { marginTop: Spacing.lg }]}>Trip started</Text>
        <Text style={styles.emptyBody}>Waiting for your driver's location…</Text>
      </View>
    );
  }

  // ── Live map ────────────────────────────────────────────────────────────────
  const driverCoord = {
    latitude: driverLocation.latitude,
    longitude: driverLocation.longitude,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={{ ...driverCoord, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        onMapReady={() => setMapReady(true)}
      >
        <Marker
          coordinate={driverCoord}
          rotation={driverLocation.heading ?? 0}
          flat
          anchor={{ x: 0.5, y: 0.5 }}
          title={community?.vehicleName || 'Your bus'}
        >
          <View style={[styles.busMarker, isStale && styles.busMarkerStale]}>
            <Text style={styles.busEmoji}>🚌</Text>
          </View>
        </Marker>

        {pickup && (
          <Marker
            coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
            title="Your pickup"
            description={pickup.address}
            pinColor={Colors.primary}
          />
        )}
      </MapView>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          {community?.vehicleName
            ? `${community.vehicleName} · ${community.driverName}`
            : community?.driverName ?? 'Your driver'}
        </Text>

        {pickedUp ? (
          <Text style={styles.etaMain}>You've been picked up</Text>
        ) : eta ? (
          <>
            <Text style={styles.etaMain}>{formatEta(eta.minutes)}</Text>
            <Text style={styles.cardSub}>
              {formatDistance(eta.distanceMeters)} from your pickup
            </Text>
          </>
        ) : (
          <Text style={styles.cardSub}>
            Set your pickup location in Edit Locations to see your ETA.
          </Text>
        )}

        {isStale && (
          <View style={styles.staleBanner}>
            <Text style={styles.staleText}>
              Location last updated {secondsSinceUpdate}s ago — the driver's signal may be
              weak.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.bg,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  busMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busMarkerStale: { borderColor: Colors.warning },
  busEmoji: { fontSize: 20 },
  card: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardLabel: { ...Typography.labelCaps, color: Colors.textSecondary },
  etaMain: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  cardSub: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  staleBanner: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.button,
    backgroundColor: Colors.warningLight,
  },
  staleText: { ...Typography.bodySmall, color: Colors.warningText },
});