import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Colors, Radius, Spacing } from '@styles/tokens';
import type { RouteStopEntry } from '@utils/routeStopEntries';
import type { LatLng } from '@hooks/useRouteDirections';

// ─── Region helper ────────────────────────────────────────────────────────────

function getRegion(entries: RouteStopEntry[]) {
  if (entries.length === 0) {
    // Default to Colombo
    return { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }
  const lats = entries.map((e) => e.location.latitude);
  const lngs = entries.map((e) => e.location.longitude);
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
  entries: RouteStopEntry[];  // unified, ordered pickup+dropoff stops (present-only)
  polyline?: LatLng[];        // real driving path (driver → entry1 → entry2 → …) from Directions API
}

export default function RouteMap({ entries, polyline = [] }: Props) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (entries.length === 0 || !mapRef.current) return;
    const coords = entries.map((e) => e.location);
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 48, right: 32, bottom: 48, left: 32 },
        animated: true,
      });
    }, 400);
  }, [entries]);

  return (
    <View style={styles.card}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={getRegion(entries)}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Real driving-route polyline (road-snapped, via Directions API) */}
        {polyline.length > 1 && (
          <Polyline
            coordinates={polyline}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}

        {/* Fallback straight dashed line while directions are still loading */}
        {polyline.length <= 1 && entries.length > 1 && (
          <Polyline
            coordinates={entries.map((e) => e.location)}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}

        {/* Numbered stop markers, colour-coded by pickup vs dropoff */}
        {entries.map((entry, i) => {
          const isDropoff = entry.kind === 'dropoff';
          const names = entry.passengers.map((p) => p.name).join(', ');
          return (
            <Marker
              key={entry.id}
              coordinate={entry.location}
              title={`${i + 1}. ${names}`}
              description={isDropoff ? 'Drop-off' : 'Pickup'}
            >
              <View style={styles.markerWrap}>
                <View style={[styles.marker, isDropoff && styles.markerDropoff]}>
                  <Text style={styles.markerText}>{i + 1}</Text>
                </View>
                <View style={[styles.markerTail, isDropoff && styles.markerTailDropoff]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.primary, label: 'Pickup' },
          { color: Colors.purple, label: 'Drop-off' },
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
  markerDropoff: { backgroundColor: Colors.purple },
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
  markerTailDropoff: { borderTopColor: Colors.purple },
});
