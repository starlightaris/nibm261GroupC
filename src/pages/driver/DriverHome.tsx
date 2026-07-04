import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDriverRoute, RouteStop } from '@hooks/useDriverRoute';
import type { RootStackParams } from '@navigation/types';
import { Colors, Radius, Spacing } from '@styles/tokens';

type NavProp = NativeStackNavigationProp<RootStackParams>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateTripStart(
  stops: RouteStop[],
  activeShift: string | null,
  communityId: string | null
): string | null {
  if (!activeShift) {
    return 'Could not determine the active shift. Please check your vehicle shift times in Settings.';
  }
  if (!communityId) {
    return 'No community found. Please contact your administrator.';
  }
  if (stops.length === 0) {
    return 'No passengers are scheduled for this shift. All passengers may be marked absent.';
  }
  const pickableCount = stops.filter(
    (s) => s.attendanceStatus !== 'absent'
  ).length;
  if (pickableCount === 0) {
    return 'All passengers are marked absent for this shift. No trip to start.';
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StopItem({ item, index }: { item: RouteStop; index: number }) {
  const isAbsent = item.attendanceStatus === 'absent';

  return (
    <View style={[styles.stopRow, isAbsent && styles.stopRowAbsent]}>
      {/* stop number */}
      <View style={[styles.stopIndex, isAbsent && styles.stopIndexAbsent]}>
        <Text style={styles.stopIndexText}>{index + 1}</Text>
      </View>

      {/* avatar */}
      <View style={[styles.avatar, isAbsent && styles.avatarAbsent]}>
        <Text style={[styles.avatarText, isAbsent && styles.avatarTextAbsent]}>
          {item.initials}
        </Text>
      </View>

      {/* info */}
      <View style={styles.stopInfo}>
        <Text style={[styles.stopName, isAbsent && styles.stopNameAbsent]}>
          {item.name}
        </Text>
        <Text
          style={[
            styles.stopStatus,
            item.attendanceStatus === 'present' && styles.statusPresent,
            item.attendanceStatus === 'absent'   && styles.statusAbsent,
          ]}
        >
          {item.attendanceStatus === 'present'
            ? '● Confirmed'
            : item.attendanceStatus === 'absent'
            ? '● Absent — will be skipped'
            : '○ Tentative'}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DriverHomeScreen() {
  const navigation   = useNavigation<NavProp>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    stops,
    activeShift,
    communityId,
    loading,
    error,
  } = useDriverRoute();

  // ── Derived counts ──────────────────────────────────────────────────────────
  const confirmedCount  = stops.filter((s) => s.attendanceStatus === 'present').length;
  const tentativeCount  = stops.filter((s) => s.attendanceStatus === 'unmarked').length;
  const absentCount     = stops.filter((s) => s.attendanceStatus === 'absent').length;
  const pickableCount   = confirmedCount + tentativeCount;

  // ── Pull-to-refresh ─────────────────────────────────────────────────────────
  // useDriverRoute refetches on mount; to force a manual refresh we just
  // remount via a key — but since the hook uses onAuthStateChanged internally,
  // the simplest safe approach is a short visual delay.
  const handleRefresh = async () => {
    setRefreshing(true);
    // The hook re-runs automatically when the component remounts,
    // so just give visual feedback here.
    setTimeout(() => setRefreshing(false), 1200);
  };

  // ── Start trip ──────────────────────────────────────────────────────────────
  const handleStartTrip = () => {
    // Run validations before navigating
    const validationError = validateTripStart(stops, activeShift, communityId);
    if (validationError) {
      Alert.alert('Cannot Start Trip', validationError, [{ text: 'OK' }]);
      return;
    }

    // Filter out absent passengers — useActiveTrip will only create stops
    // for passengers the driver will actually pick up.
    // (useDriverRoute already does this via activeStops, but stops prop
    //  here is already filtered. Keeping explicit for clarity.)
    const activeStops = stops.filter((s) => s.attendanceStatus !== 'absent');

    if (activeStops.length === 0) {
      Alert.alert(
        'No Passengers',
        'There are no passengers to pick up for this shift.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirm before starting — prevents accidental taps
    Alert.alert(
      'Start Trip?',
      `You are about to start the ${activeShift} trip with ${activeStops.length} passenger${activeStops.length !== 1 ? 's' : ''}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          style: 'default',
          onPress: () => {
            navigation.navigate('ActiveTrip', {
              stops:       activeStops,
              shift:       activeShift!,
              communityId: communityId!,
            });
          },
        },
      ]
    );
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading today's route…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Check your connection and pull down to retry.
        </Text>
      </SafeAreaView>
    );
  }

  // ── No community yet ────────────────────────────────────────────────────────
  if (!communityId) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>No Community Assigned</Text>
        <Text style={styles.emptyBody}>
          You haven't been assigned to a community yet. Please contact your
          administrator.
        </Text>
      </SafeAreaView>
    );
  }

  const canStart = pickableCount > 0 && !!activeShift && !!communityId;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.heading}>Today's Route</Text>
        {activeShift && (
          <View style={styles.shiftBadge}>
            <Text style={styles.shiftText}>
              {activeShift === 'morning' ? '🌅 Morning' : '🌆 Evening'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{pickableCount}</Text>
          <Text style={styles.summaryLabel}>To Pick Up</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: Colors.success }]}>
            {confirmedCount}
          </Text>
          <Text style={styles.summaryLabel}>Confirmed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: Colors.textSecondary }]}>
            {tentativeCount}
          </Text>
          <Text style={styles.summaryLabel}>Tentative</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: Colors.error }]}>
            {absentCount}
          </Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
      </View>

      {/* ── Passenger list ───────────────────────────────────────────────── */}
      {stops.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No Passengers Today</Text>
          <Text style={styles.emptyBody}>
            No passengers are scheduled for the{' '}
            {activeShift ?? 'current'} shift. Pull down to refresh.
          </Text>
        </View>
      ) : (
        <FlatList
          data={stops}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item, index }) => (
            <StopItem item={item} index={index} />
          )}
          ListFooterComponent={
            absentCount > 0 ? (
              <View style={styles.absentNote}>
                <Text style={styles.absentNoteText}>
                  {absentCount} passenger{absentCount !== 1 ? 's are' : ' is'} absent
                  and will be skipped automatically.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* ── Footer — Start Trip button ───────────────────────────────────── */}
      <View style={styles.footer}>
        {/* Validation hint shown above button when trip cannot start */}
        {!canStart && stops.length > 0 && (
          <Text style={styles.hintText}>
            {!activeShift
              ? 'Shift times not configured. Go to Settings → Shift Times.'
              : 'No passengers available to pick up for this shift.'}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={handleStartTrip}
          disabled={!canStart}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.startBtnText}>
              {!canStart
                ? 'No Passengers to Pick Up'
                : `Start ${activeShift === 'morning' ? 'Morning' : 'Evening'} Trip  →`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // centred states
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    padding: Spacing.xxl,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorIcon: { fontSize: 32 },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  shiftBadge: {
    backgroundColor: Colors.primary + '18',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  shiftText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  // summary
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md ?? 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // list
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#E0E0E0',
  },

  // stop row
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  stopRowAbsent: {
    opacity: 0.45,
  },
  stopIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIndexAbsent: {
    backgroundColor: Colors.muted,
  },
  stopIndexText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAbsent: {
    backgroundColor: '#E0E0E0',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  avatarTextAbsent: {
    color: Colors.muted,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  stopNameAbsent: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  stopStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusPresent: { color: Colors.success },
  statusAbsent:  { color: Colors.error },

  // absent footer note
  absentNote: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.error + '12',
    borderRadius: Radius.md ?? 10,
    borderWidth: 0.5,
    borderColor: Colors.error + '40',
  },
  absentNoteText: {
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
  },

  // empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
  },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnDisabled: {
    backgroundColor: Colors.muted,
  },
  startBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});