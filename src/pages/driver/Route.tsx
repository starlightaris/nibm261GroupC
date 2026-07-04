import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Platform,} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDriverRoute } from '@hooks/useDriverRoute';
import { Colors, Radius, Spacing } from '@styles/tokens';
import type { RootStackParams } from '@navigation/types';
import ShiftBadge from '@components/driver/route/ShiftBadge';
import RouteMap from '@components/driver/route/RouteMap';
import StopRow from '@components/driver/route/StopRow';
import { EmptyRoute, ErrorState } from '@components/driver/route/EmptyRoute';

type RouteNavProp = NativeStackNavigationProp<RootStackParams, 'DriverTabs'>;

export default function RouteScreen() {
  const navigation = useNavigation<RouteNavProp>();
  const { stops, allMembers, activeShift, communityId, loading, error } = useDriverRoute();

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

  const confirmedCount = stops.filter((s) => s.attendanceStatus === 'present').length;
  const pendingCount   = stops.filter((s) => s.attendanceStatus === 'unmarked').length;
  const absentMembers  = allMembers.filter((m) => m.attendanceStatus === 'absent');

  const handleStartTrip = () => {
    if (!communityId || !activeShift) return;
    navigation.navigate('ActiveTrip', {
      stops,
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
          <Stat label="Stops"     value={stops.length} />
          <Stat label="Confirmed" value={confirmedCount} color={Colors.success} bordered />
          {pendingCount > 0 && (
            <Stat label="Pending" value={pendingCount} color="#92400E" />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: Spacing.lg }}>
          <RouteMap stops={stops} absentMembers={absentMembers} />
        </View>

        {/* Stop list */}
        <View style={styles.listCard}>
          <Text style={styles.sectionLabel}>
            {stops.length > 0 ? 'Stop order' : 'Passengers'}
          </Text>

          {stops.length === 0 && allMembers.length === 0 ? (
            <EmptyRoute />
          ) : (
            <>
              {stops.map((stop, i) => (
                <StopRow key={stop.userId} stop={stop} index={i} total={stops.length} />
              ))}

              {absentMembers.length > 0 && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>Not riding today</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  {absentMembers.map((stop, i) => (
                    <StopRow key={stop.userId} stop={stop} index={i} total={absentMembers.length} />
                  ))}
                </>
              )}
            </>
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

  divider:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { fontSize: 11, color: Colors.muted, fontWeight: '500' },

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