import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { AttendanceStatus, Shift, TodayAttendance } from '@hooks/useAttendance';

interface ShiftRowProps {
  label: string;
  emoji: string;
  status: AttendanceStatus;
  isMarking: boolean;
  onMark: (status: AttendanceStatus) => void;
}

function ShiftRow({ label, emoji, status, isMarking, onMark }: ShiftRowProps) {
  return (
    <View style={styles.shiftRow}>
      <View style={styles.shiftLabel}>
        <Text style={styles.shiftEmoji}>{emoji}</Text>
        <Text style={styles.shiftText}>{label}</Text>
        {status !== 'unmarked' && (
          <View style={[styles.statusPill, status === 'present' ? styles.pillPresent : styles.pillAbsent]}>
            <Text style={[styles.pillText, status === 'present' ? styles.pillPresentText : styles.pillAbsentText]}>
              {status === 'present' ? 'Present' : 'Absent'}
            </Text>
          </View>
        )}
      </View>

      {isMarking ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, status === 'present' && styles.actionBtnActive]}
            onPress={() => onMark('present')}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, status === 'present' && styles.actionBtnActiveText]}>
              ✓  Present
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, status === 'absent' && styles.actionBtnAbsent]}
            onPress={() => onMark('absent')}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, status === 'absent' && styles.actionBtnAbsentText]}>
              ✕  Absent
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface Props {
  attendance: TodayAttendance;
  marking: Shift | null;
  onMark: (shift: Shift, status: AttendanceStatus) => void;
}

export default function AttendanceCard({ attendance, marking, onMark }: Props) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>Today's Attendance</Text>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      <ShiftRow
        label="Morning"
        emoji="🌅"
        status={attendance.morning.status}
        isMarking={marking === 'morning'}
        onMark={(status) => onMark('morning', status)}
      />

      <View style={styles.divider} />

      <ShiftRow
        label="Evening"
        emoji="🌆"
        status={attendance.evening.status}
        isMarking={marking === 'evening'}
        onMark={(status) => onMark('evening', status)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  header: { marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  dateText:     { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', marginTop: 2 },

  shiftRow:  { paddingVertical: Spacing.sm },
  shiftLabel:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  shiftEmoji:{ fontSize: 16 },
  shiftText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  statusPill:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  pillPresent:     { backgroundColor: '#DCFCE7' },
  pillAbsent:      { backgroundColor: Colors.border },
  pillText:        { fontSize: 11, fontWeight: '600' },
  pillPresentText: { color: '#15803D' },
  pillAbsentText:  { color: Colors.muted },

  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.button,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  actionBtnActive:      { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionBtnAbsent:      { backgroundColor: Colors.border, borderColor: Colors.border },
  actionBtnText:        { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  actionBtnActiveText:  { color: Colors.white },
  actionBtnAbsentText:  { color: Colors.textPrimary },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
});
