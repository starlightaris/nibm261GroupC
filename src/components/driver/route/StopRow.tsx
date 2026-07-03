import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { RouteStop } from '@hooks/useDriverRoute';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, absent }: { initials: string; absent: boolean }) {
  return (
    <View style={[styles.avatar, absent && styles.avatarAbsent]}>
      <Text style={[styles.avatarText, absent && styles.avatarAbsentText]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: RouteStop['attendanceStatus'] }) {
  if (status === 'present') {
    return (
      <View style={[styles.pill, styles.pillPresent]}>
        <Text style={[styles.pillText, styles.pillPresentText]}>Confirmed</Text>
      </View>
    );
  }
  if (status === 'absent') {
    return (
      <View style={[styles.pill, styles.pillAbsent]}>
        <Text style={[styles.pillText, styles.pillAbsentText]}>Absent</Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, styles.pillUnmarked]}>
      <Text style={[styles.pillText, styles.pillUnmarkedText]}>Pending</Text>
    </View>
  );
}

// ─── Stop row ─────────────────────────────────────────────────────────────────

interface Props {
  stop: RouteStop;
  index: number;
  total: number;
}

export default function StopRow({ stop, index, total }: Props) {
  const isAbsent = stop.attendanceStatus === 'absent';
  const isLast = index === total - 1;

  return (
    <View style={[styles.row, isAbsent && styles.rowAbsent]}>
      {/* Timeline spine */}
      <View style={styles.timelineCol}>
        <View style={[styles.dot, isAbsent && styles.dotAbsent]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Avatar initials={stop.initials} absent={isAbsent} />
            <Text style={[styles.name, isAbsent && styles.nameAbsent]} numberOfLines={1}>
              {stop.name}
            </Text>
          </View>
          <StatusPill status={stop.attendanceStatus} />
        </View>
        <Text style={styles.coords}>
          {stop.pickupLocation.latitude.toFixed(5)},{' '}
          {stop.pickupLocation.longitude.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rowAbsent: { opacity: 0.5 },

  // Timeline
  timelineCol: { width: 24, alignItems: 'center', marginRight: Spacing.md },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 14,
  },
  dotAbsent: { backgroundColor: Colors.muted },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 24,
  },

  // Content
  content: { flex: 1, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  nameAbsent: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  coords: { fontSize: 11, color: Colors.muted, marginTop: 2, marginLeft: 36 },

  // Avatar
  avatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.avatar,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAbsent: { backgroundColor: Colors.absent },
  avatarText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  avatarAbsentText: { color: Colors.absentText },

  // Pills
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  pillText: { fontSize: 11, fontWeight: '600' },
  pillPresent: { backgroundColor: Colors.successLight },
  pillPresentText: { color: Colors.successText },
  pillAbsent: { backgroundColor: Colors.absent },
  pillAbsentText: { color: Colors.absentText },
  pillUnmarked: { backgroundColor: Colors.warningLight },
  pillUnmarkedText: { color: Colors.warningText },
});
