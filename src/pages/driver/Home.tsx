import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, AppState, Platform, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { db } from '../../../firebaseConfig';
import { useCommunity } from '@hooks/useCommunity';
import InitialsAvatar from '@components/driver/activetrip/InitialsAvatar';
import { Colors, Radius, Spacing } from '@styles/tokens';
import {
  DEFAULT_CUTOFFS, currentDriverShift, cutoffLabel, localDateKey,
  summarizeShift, type AttendanceRecord, type DriverShift,
} from '@utils/driverAttendance';
import type { DriverTabParams } from '@navigation/types';

type Props = BottomTabScreenProps<DriverTabParams, 'DriverHome'>;

export default function DriverHomeScreen({ navigation }: Props) {
  const { community, loading: communityLoading, error: communityError } = useCommunity();
  const [now, setNow] = useState(() => new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const date = localDateKey(now);
  const activeShift = currentDriverShift(now);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!community?.id) {
      setRecords([]);
      setAttendanceLoading(false);
      setAttendanceError(null);
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('communityId', '==', community.id),
      where('date', '==', date),
    );
    return onSnapshot(attendanceQuery, (snapshot) => {
      setRecords(snapshot.docs.map((entry) => entry.data() as AttendanceRecord));
      setAttendanceLoading(false);
      setAttendanceError(null);
    }, (error) => {
      console.error('[DriverHome] attendance:', error);
      setAttendanceError('Could not load today’s attendance. Please try again.');
      setAttendanceLoading(false);
    });
  }, [community?.id, date]);

  const members = community?.members ?? [];
  const morning = useMemo(() => summarizeShift(members, records, 'morning'), [members, records]);
  const evening = useMemo(() => summarizeShift(members, records, 'evening'), [members, records]);
  const confirmed = activeShift === 'morning' ? morning.confirmed : evening.confirmed;
  const cutoffs = {
    morning: community?.shiftTimes.morningCutoff ?? DEFAULT_CUTOFFS.morning,
    evening: community?.shiftTimes.eveningCutoff ?? DEFAULT_CUTOFFS.evening,
  };

  if (communityLoading || attendanceLoading) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /><Text style={styles.subtle}>Loading attendance…</Text></SafeAreaView>;
  }

  if (communityError || attendanceError) {
    return <SafeAreaView style={styles.centered}><Text style={styles.error}>{communityError ?? attendanceError}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <View style={styles.header}><Text style={styles.title}>Driver Home</Text><Text style={styles.subtle}>Today’s attendance</Text></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.shiftRow}>
          <ShiftCard shift="morning" now={now} cutoff={cutoffs.morning} active={activeShift === 'morning'} summary={morning} />
          <ShiftCard shift="evening" now={now} cutoff={cutoffs.evening} active={activeShift === 'evening'} summary={evening} />
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>{activeShift === 'morning' ? 'Morning' : 'Evening'} confirmed passengers</Text>
          {confirmed.length === 0 ? (
            <Text style={styles.subtle}>No passengers have confirmed for this shift yet.</Text>
          ) : confirmed.map((member) => (
            <View key={member.userId} style={styles.passengerRow}>
              <InitialsAvatar initials={member.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')} size={38} />
              <Text style={styles.passengerName}>{member.name}</Text>
              <Text style={styles.checkmark} accessibilityLabel="Confirmed">✓</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.routeButton} onPress={() => navigation.navigate('DriverRoute')} accessibilityRole="button" accessibilityLabel="Review route">
          <Text style={styles.routeButtonText}>Review route →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ShiftCard({ shift, now, cutoff, active, summary }: {
  shift: DriverShift;
  now: Date;
  cutoff: string;
  active: boolean;
  summary: ReturnType<typeof summarizeShift>;
}) {
  return (
    <View style={[styles.shiftCard, active && styles.activeCard]}>
      <View style={styles.shiftHeading}>
        <Text style={styles.shiftName}>{shift === 'morning' ? 'Morning' : 'Evening'}</Text>
        {active && <Text style={styles.nowPill}>Now</Text>}
      </View>
      <Text style={styles.count}>{summary.confirmed.length}<Text style={styles.total}> / {summary.total}</Text></Text>
      <Text style={styles.subtle}>confirmed</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${summary.percent}%`, backgroundColor: summary.progressColor }]} /></View>
      <Text style={styles.cutoff}>{cutoffLabel(now, cutoff)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, backgroundColor: Colors.bg },
  error: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  subtle: { color: Colors.textSecondary, fontSize: 13 },
  header: { backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.sm, paddingBottom: Spacing.md },
  title: { color: Colors.textPrimary, fontSize: 21, fontWeight: '700', marginBottom: 2 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  shiftRow: { flexDirection: 'row', gap: Spacing.md },
  shiftCard: { flex: 1, minWidth: 0, backgroundColor: Colors.white, padding: Spacing.md, borderRadius: Radius.card, borderWidth: 1.5, borderColor: Colors.border },
  activeCard: { borderColor: Colors.primary },
  shiftHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.xs },
  shiftName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  nowPill: { overflow: 'hidden', backgroundColor: Colors.primaryLight, color: Colors.primary, fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 3, borderRadius: Radius.pill },
  count: { fontSize: 27, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.md },
  total: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  progressTrack: { height: 7, borderRadius: Radius.pill, backgroundColor: Colors.border, overflow: 'hidden', marginTop: Spacing.md },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  cutoff: { color: Colors.textSecondary, fontSize: 12, marginTop: Spacing.sm },
  listCard: { backgroundColor: Colors.white, borderRadius: Radius.card, padding: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  passengerName: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  checkmark: { color: Colors.success, fontSize: 20, fontWeight: '700' },
  bottomBar: { padding: Spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  routeButton: { borderRadius: Radius.button, backgroundColor: Colors.primary, alignItems: 'center', paddingVertical: Spacing.md },
  routeButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
