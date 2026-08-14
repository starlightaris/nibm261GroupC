import React, { useMemo, useState, useEffect } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Platform,} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useDriverRoute } from '@hooks/useDriverRoute';
import { useWaypointPolyline } from '@hooks/useWaypointPolyline';
import { buildStopEntries, type RouteStopEntry } from '@utils/routeStopEntries';
import { Colors, Radius, Spacing } from '@styles/tokens';
import type { RootStackParams } from '@navigation/types';
import ShiftBadge from '@components/driver/route/ShiftBadge';
import RouteMap from '@components/driver/route/RouteMap';
import StopRow from '@components/driver/route/StopRow';
import { EmptyRoute, ErrorState } from '@components/driver/route/EmptyRoute';

type RouteNavProp = NativeStackNavigationProp<RootStackParams, 'DriverTabs'>;

const MAPS_API_KEY: string =
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey ??
  Constants.expoConfig?.ios?.config?.googleMapsApiKey ??
  '';

export default function RouteScreen() {
  const navigation = useNavigation<RouteNavProp>();
  const { stops, activeShift, communityId, loading, error } = useDriverRoute();

  // Unified pickup+dropoff stop list, grouped by proximity and defaulted to
  // pick-everyone-up-then-drop-everyone-off order. Seeds local state so the
  // driver can manually reorder via the ▲▼ controls; resets if the
  // underlying route data reloads.
  const defaultEntries = useMemo(() => buildStopEntries(stops), [stops]);
  const [entries, setEntries] = useState<RouteStopEntry[]>(defaultEntries);

  useEffect(() => {
    setEntries(defaultEntries);
  }, [defaultEntries]);

  function moveEntry(index: number, direction: -1 | 1) {
    setEntries((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // Real driving-route polyline through all stops (driver → stop1 → stop2 → …),
  // same Directions API path used on the active-trip map.
  const { fullPolyline } = useWaypointPolyline({
    waypoints: entries.map((e) => e.location),
    apiKey: MAPS_API_KEY,
    enabled: entries.length > 0,
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your route…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <ErrorState message={error} />
      </SafeAreaView>
    );
  }

  const handleStartTrip = () => {
    if (!communityId || !activeShift) return;
    // Pickup order follows the driver's (possibly manually reordered) list,
    // not the raw hook order — so a manual reorder actually changes the trip.
    const pickupOrder = entries
      .filter((e) => e.kind === 'pickup')
      .flatMap((e) => e.passengers);
    navigation.navigate('ActiveTrip', {
      stops: pickupOrder,
      shift: activeShift,
      communityId,
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's Route</Text>
          {activeShift && <ShiftBadge shift={activeShift} />}
        </View>
        <View style={styles.stats}>
          <Stat label="Passengers" value={stops.length} />
          <Stat label="Stops" value={entries.length} bordered />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: Spacing.lg }}>
          <RouteMap entries={entries} polyline={fullPolyline} />
        </View>

        {/* Stop list */}
        <View style={styles.listCard}>
          <Text style={styles.sectionLabel}>
            {entries.length > 0 ? 'Stop order' : 'Passengers'}
          </Text>

          {entries.length === 0 ? (
            <EmptyRoute />
          ) : (
            entries.map((entry, i) => (
              <StopRow
                key={entry.id}
                entry={entry}
                index={i}
                total={entries.length}
                onMoveUp={() => moveEntry(i, -1)}
                onMoveDown={() => moveEntry(i, 1)}
              />
            ))
          )}
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Start Trip — sticky bottom bar */}
      {stops.length > 0 && (
        <View style={styles.fabBar}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleStartTrip}
            activeOpacity={0.88}
          >
            <Text style={styles.fabText}>Start Trip  →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  color,
  bordered,
}: {
  label: string;
  value: number;
  color?: string;
  bordered?: boolean;
}) {
  return (
    <View style={[statStyles.box, bordered && statStyles.bordered]}>
      <Text style={[statStyles.value, color ? { color } : undefined]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box:      { alignItems: 'center' },
  bordered: { paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: Colors.border },
  value:    { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, lineHeight: 24 },
  label:    { fontSize: 10, color: Colors.textSecondary, fontWeight: '500',
              textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center',
              justifyContent: 'center', padding: Spacing.xxl },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title:  { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  stats:  { flexDirection: 'row', alignItems: 'center', gap: 12 },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  listCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: Radius.card,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.lg,
  },

  fabBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fab: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});