import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { RouteStop } from '@hooks/useDriverRoute';

// ─── Region helper ────────────────────────────────────────────────────────────

function getRegion(stops: RouteStop[]) {
  if (stops.length === 0) {
    // Default to Colombo
    return { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }
  const lats = stops.map((s) => s.pickupLocation.latitude);
  const lngs = stops.map((s) => s.pickupLocation.longitude);
  const padding = 0.015;
  return {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta: Math.max(Math.max(...lats) - Math.min(...lats) + padding * 2, 0.02),
    longitudeDelta: Math.max(Math.max(...lngs) - Math.min(...lngs) + padding * 2, 0.02),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  stops: RouteStop[];       // active (non-absent) stops
  absentMembers: RouteStop[];
}

export default function RouteMap({ stops, absentMembers }: Props) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (stops.length === 0 || !mapRef.current) return;
    const coords = stops.map((s) => s.pickupLocation);
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 48, right: 32, bottom: 48, left: 32 },
        animated: true,
      });
    }, 400);
  }, [stops]);

  return (
    <View style={styles.card}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={getRegion(stops)}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Dashed route polyline */}
        {stops.length > 1 && (
          <Polyline
            coordinates={stops.map((s) => s.pickupLocation)}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}

        {/* Numbered stop markers */}
        {stops.map((stop, i) => (
          <Marker
            key={`stop-${stop.userId}`}
            coordinate={stop.pickupLocation}
            title={stop.name}
            description={stop.attendanceStatus === 'unmarked' ? 'Pending confirmation' : 'Confirmed'}
          >
            <View style={styles.markerWrap}>
              <View style={[styles.marker, stop.attendanceStatus === 'unmarked' && styles.markerPending]}>
                <Text style={styles.markerText}>{i + 1}</Text>
              </View>
              <View style={[styles.markerTail, stop.attendanceStatus === 'unmarked' && styles.markerTailPending]} />
            </View>
          </Marker>
        ))}

        {/* Ghost markers for absent members */}
        {absentMembers.map((m) => (
          <Marker
            key={`absent-${m.userId}`}
            coordinate={m.pickupLocation}
            title={m.name}
            description="Absent today"
          >
            <View style={styles.markerAbsent}>
              <Text style={styles.markerAbsentText}>✕</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.primary, label: 'Active stop' },
          { color: Colors.warning, label: 'Pending' },
          { color: Colors.muted, label: 'Absent' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  map: { height: 280, width: '100%' },

  // Legend
  legend: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  // Markers
  markerWrap: { alignItems: 'center' },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  markerPending: { backgroundColor: Colors.warning },
  markerText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
    marginTop: -1,
  },
  markerTailPending: { borderTopColor: Colors.warning },
  markerAbsent: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerAbsentText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
});
